import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const matches = JSON.parse(localStorage.getItem('matches') || '[]');
  const match = matches.find((m: any) => m.user.id === matchId);

  useEffect(() => {
    if (!match) {
      navigate('/matches');
      return;
    }

    const storedMessages = JSON.parse(
      localStorage.getItem(`chat_${matchId}`) || '[]'
    );
    setMessages(storedMessages);
  }, [matchId, match, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem(`chat_${matchId}`, JSON.stringify(updatedMessages));
    setNewMessage('');

    // Simulate response after 2 seconds
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        senderId: matchId!,
        text: "Hey! Thanks for your message. This is a demo response 😊",
        timestamp: new Date().toISOString(),
      };
      const withResponse = [...updatedMessages, response];
      setMessages(withResponse);
      localStorage.setItem(`chat_${matchId}`, JSON.stringify(withResponse));
    }, 2000);
  };

  if (!match) return null;

  return (
    <>
      <Header />
      <div className="container max-w-4xl flex flex-col h-[calc(100vh-4rem)]">
        {/* Chat Header */}
        <div className="flex items-center gap-4 py-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/matches')}
          >
            <ArrowLeft />
          </Button>
          <img
            src={match.user.profilePhoto}
            alt={match.user.name}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <h2 className="font-semibold">
              {match.user.name}, {match.user.age}
            </h2>
            <p className="text-sm text-muted-foreground">Active now</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p>Start the conversation with {match.user.name}!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'gradient-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="py-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
