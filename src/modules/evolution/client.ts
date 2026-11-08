import {
  SendTextMessageParams,
  SendMediaMessageParams,
  EvolutionContactProfile,
} from "./types";
import { evolutionService } from "./evolution.service";

/**
 * EvolutionApiClient
 * Facade that proxies all operations through EvolutionService ensuring
 * centralized architecture, instance resolution and error handling.
 */
export class EvolutionApiClient {
  public cleanPhoneNumber(rawPhone: string): string {
    return rawPhone.replace("@s.whatsapp.net", "").replace(/\D/g, "");
  }

  public async sendTextMessage(
    params: SendTextMessageParams
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const result = await evolutionService.sendTextMessage({
      number: this.cleanPhoneNumber(params.number),
      text: params.text,
      delay: params.delay,
    });
    return { success: result.success, data: result.data, error: result.error };
  }

  public async sendMediaMessage(
    params: SendMediaMessageParams
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const result = await evolutionService.sendMediaMessage({
      number: this.cleanPhoneNumber(params.number),
      mediatype: params.mediatype,
      media: params.media,
      caption: params.caption,
      fileName: params.fileName,
      delay: params.delay,
    });
    return { success: result.success, data: result.data, error: result.error };
  }

  public async fetchContact(phone: string): Promise<EvolutionContactProfile> {
    const cleanNumber = this.cleanPhoneNumber(phone);
    const result = await evolutionService.fetchContact(cleanNumber);
    return {
      id: result.id,
      name: result.name,
      phone: result.phone,
      profilePicUrl: result.profilePicUrl,
      isGroup: result.isGroup,
    };
  }

  public async checkInstanceStatus(): Promise<{ state: "open" | "close" | "connecting" | "unknown"; details?: unknown }> {
    const config = await evolutionService.getConfig();
    const active = config.instances.find((i) => i.name === config.selectedInstanceName) || config.instances[0];
    return { state: active?.status || "unknown", details: active };
  }
}
