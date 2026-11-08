import { NextRequest, NextResponse } from "next/server";
import { executionRepository } from "@/modules/database/repositories/execution.repository";
import { chatbotRepository } from "@/modules/database/repositories/chatbot.repository";
import { contactRepository } from "@/modules/database/repositories/contact.repository";
import { logRepository } from "@/modules/database/repositories/log.repository";
import { FlowEngine } from "@/modules/flow-engine/FlowEngine";
import { evolutionService } from "@/modules/evolution/evolution.service";
import { EngineTriggerEvent, ContactData } from "@/modules/flow-engine/types";

export async function POST() {
  try {
    const flowEngine = new FlowEngine();
    const dueStates = await executionRepository.findDueDelayedStates();

    const resumedList = [];

    for (const state of dueStates) {
      const version = await chatbotRepository.getVersionById(state.chatbot_version_id);
      if (!version) continue;

      const contactRecord = await contactRepository.findById(state.contact_id);
      if (!contactRecord) continue;

      const contactData: ContactData = {
        id: contactRecord.id,
        name: contactRecord.name,
        phone: contactRecord.phone,
        tags: contactRecord.tags,
        variables: contactRecord.variables,
      };

      const triggerEvent: EngineTriggerEvent = {
        type: "timer_wakeup",
        timestamp: new Date().toISOString(),
      };

      const result = await flowEngine.execute(
        version.flow_data,
        contactData,
        state,
        triggerEvent
      );

      // Dispatch outgoing messages
      for (const action of result.dispatchedActions) {
        if (action.type === "send_text_message") {
          await evolutionService.sendTextMessage({
            number: contactRecord.phone,
            text: String(action.payload.text || ""),
            delay: Number(action.payload.delaySeconds || 1),
          });
        } else if (action.type === "send_media_message") {
          await evolutionService.sendMediaMessage({
            number: contactRecord.phone,
            mediatype: action.payload.mediaType as any,
            media: String(action.payload.mediaUrl || ""),
            caption: String(action.payload.caption || ""),
            fileName: String(action.payload.fileName || ""),
            delay: Number(action.payload.delaySeconds || 1),
          });
        }
      }

      // Update tags and variables
      await contactRepository.updateTags(contactRecord.id, result.tags);
      await contactRepository.updateVariables(contactRecord.id, result.variables);

      // Update state
      await executionRepository.updateState(state.id, {
        status: result.finalStatus,
        current_node_id: result.currentNodeId,
        variables: result.variables,
        resume_at: result.resumeAt,
      });

      // Save logs
      for (const log of result.logs) {
        await logRepository.insert({
          conversation_state_id: state.id,
          chatbot_id: version.chatbot_id,
          level: log.level,
          node_id: log.nodeId,
          message: `[Retomada Programada] ${log.message}`,
          details: log.details,
        });
      }

      resumedList.push({
        stateId: state.id,
        contactPhone: contactRecord.phone,
        finalStatus: result.finalStatus,
        actionsDispatched: result.dispatchedActions.length,
      });
    }

    return NextResponse.json({
      success: true,
      dueCount: dueStates.length,
      resumedCount: resumedList.length,
      resumed: resumedList,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const dueStates = await executionRepository.findDueDelayedStates();
  return NextResponse.json({
    status: "ok",
    dueDelayedCount: dueStates.length,
    dueStates: dueStates.map((s) => ({
      id: s.id,
      contactId: s.contact_id,
      resumeAt: s.resume_at,
      currentNodeId: s.current_node_id,
    })),
  });
}
