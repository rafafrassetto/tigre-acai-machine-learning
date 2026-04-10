import { NextResponse } from "next/server"
import clientPromise from "@/app/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection } = await params
    const client = await clientPromise
    const db = client.db("tigre_acai")
    const data = await db.collection(collection).find({}).toArray()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json([])
  }
}


export async function POST(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection } = await params
    const data = await request.json()
    const client = await clientPromise
    const db = client.db("tigre_acai")

    await db.collection(collection).deleteMany({})
    
    if (Array.isArray(data) && data.length > 0) {
      const dataWithoutMongoId = data.map(({ _id, ...rest }: any) => rest)
      await db.collection(collection).insertMany(dataWithoutMongoId)
    }
    
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false })
  }
}