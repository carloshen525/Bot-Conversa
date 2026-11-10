import { NextRequest, NextResponse } from "next/server";
import { contactsService } from "@/modules/contacts/contacts.service";
import { contactsRepository } from "@/modules/contacts/contacts.repository";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contact = await contactsService.getContactById(id);
    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contato não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: contact });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao buscar contato." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const contact = await contactsService.getContactById(id);
    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contato não encontrado." },
        { status: 404 }
      );
    }

    if (body.tags && Array.isArray(body.tags)) {
      await contactsService.updateTags(id, body.tags);
    }

    if (body.variables && typeof body.variables === "object") {
      await contactsService.updateVariables(id, body.variables);
    }

    if (body.name || body.status) {
      await contactsRepository.upsert({
        id,
        phone: contact.phone,
        name: body.name || contact.name,
        status: body.status || contact.status,
      });
    }

    const updated = await contactsService.getContactById(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao atualizar contato." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await contactsRepository.delete(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao excluir contato." },
      { status: 500 }
    );
  }
}
