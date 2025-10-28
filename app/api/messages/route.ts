import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import Match from '@/models/Match';
import User from '@/models/User';
import { getUserFromToken } from '@/lib/auth';
import { sendMessageNotification } from '@/lib/push-server';
import mongoose from 'mongoose';
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const tokenData = await getUserFromToken();
    if (!tokenData) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    if (!matchId) {
      return NextResponse.json(
        { message: 'Match ID required' },
        { status: 400 }
      );
    }
    // Verify match exists and user is part of it
    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { message: 'Match not found' },
        { status: 404 }
      );
    }
    const currentUserId = tokenData.userId;
    const isPartOfMatch =
      match.user1Id.toString() === currentUserId ||
      match.user2Id.toString() === currentUserId;
    if (!isPartOfMatch) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }
    // Get messages
    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 })
      .limit(100);
    const formattedMessages = messages.map((msg) => ({
      id: String(msg._id),
      senderId: String(msg.senderId),
      receiverId: String(msg.receiverId),
      text: msg.text,
      read: msg.read,
      timestamp: msg.createdAt,
    }));
    return NextResponse.json({ messages: formattedMessages });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const tokenData = await getUserFromToken();
    if (!tokenData) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { matchId, receiverId, text } = body;
    if (!matchId || !receiverId || !text) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    // Verify match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { message: 'Match not found' },
        { status: 404 }
      );
    }
    const currentUserId = tokenData.userId;
    // Create message
    const message = await Message.create({
      matchId: new mongoose.Types.ObjectId(matchId),
      senderId: new mongoose.Types.ObjectId(currentUserId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      text: text.trim(),
    });

    // Send push notification to receiver
    const sender = await User.findById(currentUserId).select('name profilePhoto');
    if (sender) {
      sendMessageNotification(
        receiverId,
        sender.name,
        sender.profilePhoto || '/favicon.svg',
        text.trim(),
        matchId
      ).catch(err => console.error('[Messages] Error sending message notification:', err));
    }

    return NextResponse.json({
      message: {
        id: String(message._id),
        senderId: String(message.senderId),
        receiverId: String(message.receiverId),
        text: message.text,
        read: message.read,
        timestamp: message.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
