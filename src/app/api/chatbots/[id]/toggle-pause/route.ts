import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/modules/chatbots/service";
import { logRepository } from "@/modules/database/repositories/log.repository";

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const bot = await chatbotService.getChatbot(params.id);
    if (!bot) {
      return NextResponse.json(
        { success: false, error: "Chatbot não encontrado" },
        { status: 404 }
      );
    }

    // Toggle: if currently published -> pause; if paused or draft -> published (if it has published version)
    const isCurrentlyActive = bot.status === "published";
    let newStatus: "published" | "paused" = isCurrentlyActive ? "paused" : "published";

    // If attempting to activate but has no published snapshot, must publish first
    if (newStatus === "published" && !bot.current_published_version_id) {
      return NextResponse.json(
        {
          success: false,
          error: "O chatbot ainda não possui uma versão publicada. Clique em 'Publicar' primeiro.",
        },
        { status: 400 }
      );
    }

    const updated = await chatbotService.updateChatbot(params.id, {
      status: newStatus,
    });

    await logRepository.insert({
      chatbot_id: bot.id,
      level: "info",
      node_id: "system",
      message: `Chatbot "${bot.name}" ${
        newStatus === "paused" ? "pausado temporariamente." : "retomado e ativo para o WhatsApp."
      }`,
      details: { previousStatus: bot.status, newStatus },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      status: newStatus,
      isPaused: newStatus === "paused",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
