import { checkIMEI } from '@/lib/ceir';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { imei } = await req.json();
        if (!/^\d{15}$/.test(imei)) return NextResponse.json({ error: "Invalid IMEI format" }, { status: 400 });
        
        const data = await checkIMEI(imei);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}