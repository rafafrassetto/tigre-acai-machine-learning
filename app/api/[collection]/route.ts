import { NextResponse } from "next/server"
import clientPromise from "@/app/lib/mongodb"

export async function GET(request: Request, { params }: { params: { collection: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("tigre_acai")
    const data = await db.collection(params.collection).find({}).toArray()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json([])
  }
}

export async function POST(request: Request, { params }: { params: { collection: string } }) {
  try {
    const data = await request.json()
    const client = await clientPromise
    const db = client.db("tigre_acai")

    await db.collection(params.collection).deleteMany({})
    
    if (Array.isArray(data) && data.length > 0) {
      const dataWithoutMongoId = data.map(({ _id, ...rest }: any) => rest)
      await db.collection(params.collection).insertMany(dataWithoutMongoId)
    }
    
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false })
  }
}