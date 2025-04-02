import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message, boatName, boatId } = body;

    const data = await resend.emails.send({
      from: 'Nova Yachts <office@novayachts.eu>',
      to: ['cvetkovskileon@gmail.com'],
      subject: `New inquiry for ${boatName}`,
      html: `
        <h2>New Boat Inquiry</h2>
        <p><strong>Boat:</strong> ${boatName}</p>
        <p><strong>Boat ID:</strong> ${boatId}</p>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
} 