import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import Match from '@/models/Match';
import User from '@/models/User';
import { getUserFromToken } from '@/lib/auth';
import { sendMessageNotification } from '@/lib/push-server';
import mongoose from 'mongoose';
import { isSupabaseAuthEnabled } from '@/lib/auth-provider';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedSupabaseUser } from '@/lib/supabase/dating';

export async function GET(request: NextRequest) {
  try {
    if (isSupabaseAuthEnabled()) {
      return handleSupabaseGetMessages(request);
    }

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
    if (isSupabaseAuthEnabled()) {
      return handleSupabasePostMessage(request);
    }

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
    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { message: 'Match not found' },
        { status: 404 }
      );
    }
    const currentUserId = tokenData.userId;
    const message = await Message.create({
      matchId: new mongoose.Types.ObjectId(matchId),
      senderId: new mongoose.Types.ObjectId(currentUserId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      text: text.trim(),
    });

    const sender = await User.findById(currentUserId).select('name profilePhoto');
    if (sender) {
      void sendMessageNotification(
        receiverId,
        sender.name,
        sender.profilePhoto || '/favicon.svg',
        text.trim(),
        matchId
      );
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

async function handleSupabaseGetMessages(request: NextRequest) {
  const supabase = await createSupabaseClient();
  const authUser = await getAuthenticatedSupabaseUser(supabase);

  if (!authUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  if (!matchId) {
    return NextResponse.json(
      { message: 'Match ID required' },
      { status: 400 }
    );
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id')
    .eq('id', matchId)
    .eq('is_active', true)
    .maybeSingle();

  if (matchError) {
    throw matchError;
  }

  if (!match || (match.user1_id !== authUser.id && match.user2_id !== authUser.id)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, text, read_at, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    throw error;
  }

  return NextResponse.json({
    messages: (messages || []).map((message) => ({
      id: message.id,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      text: message.text,
      read: Boolean(message.read_at),
      timestamp: message.created_at,
    })),
  });
}

async function handleSupabasePostMessage(request: NextRequest) {
  const supabase = await createSupabaseClient();
  const authUser = await getAuthenticatedSupabaseUser(supabase);

  if (!authUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { matchId, receiverId, text } = body;

  if (!matchId || !receiverId || !text) {
    return NextResponse.json(
      { message: 'Missing required fields' },
      { status: 400 }
    );
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id')
    .eq('id', matchId)
    .eq('is_active', true)
    .maybeSingle();

  if (matchError) {
    throw matchError;
  }

  if (!match || (match.user1_id !== authUser.id && match.user2_id !== authUser.id)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: authUser.id,
      receiver_id: receiverId,
      text: text.trim(),
    })
    .select('id, sender_id, receiver_id, text, read_at, created_at')
    .single();

  if (error) {
    throw error;
  }

  const { data: senderProfile, error: senderError } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', authUser.id)
    .single();

  if (senderError) {
    throw senderError;
  }

  void sendMessageNotification(
    receiverId,
    senderProfile.name || 'Unknown',
    senderProfile.avatar_url || '/favicon.svg',
    text.trim(),
    matchId
  );

  return NextResponse.json(
    {
      message: {
        id: message.id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        text: message.text,
        read: Boolean(message.read_at),
        timestamp: message.created_at,
      },
    },
    { status: 201 }
  );
}
