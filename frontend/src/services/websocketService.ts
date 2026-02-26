import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type EventHandler = (event: WsAiEvent) => void;

export interface WsAiEvent {
    type: 'AI_QUESTION' | 'AI_FOLLOWUP' | 'AI_FEEDBACK' | 'COMPLETED';
    text?: string;
    question?: {
        id: number; text: string; topic: string;
        skill: string; difficulty: string; followUps: string[];
    };
    questionIdx: number;
    totalQuestions: number;
}

export interface WsAnswerPayload {
    questionText: string;
    transcript: string;
    questionId: number;
    questionIdx: number;
}

class WebSocketService {
    private client: Client | null = null;
    private sessionId: string = '';
    private onEvent: EventHandler | null = null;
    private onConnect: (() => void) | null = null;
    private onDisconnect: (() => void) | null = null;

    connect(sessionId: string, onEvent: EventHandler, onConnect?: () => void, onDisconnect?: () => void) {
        this.sessionId = sessionId;
        this.onEvent = onEvent;
        this.onConnect = onConnect || null;
        this.onDisconnect = onDisconnect || null;

        this.client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws') as any,
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('[WS] Connected to session', sessionId);
                this.client?.subscribe(`/topic/interview/${sessionId}`, (msg) => {
                    try {
                        const event: WsAiEvent = JSON.parse(msg.body);
                        this.onEvent?.(event);
                    } catch (e) {
                        console.error('[WS] Failed to parse event', e);
                    }
                });
                this.onConnect?.();
            },
            onDisconnect: () => {
                console.log('[WS] Disconnected');
                this.onDisconnect?.();
            },
            onStompError: (frame) => {
                console.error('[WS] STOMP error', frame);
            },
        });

        this.client.activate();
    }

    sendAnswer(payload: WsAnswerPayload) {
        if (this.client?.connected) {
            this.client.publish({
                destination: `/app/interview/${this.sessionId}/answer`,
                body: JSON.stringify(payload),
            });
        } else {
            console.warn('[WS] Cannot send — not connected');
        }
    }

    disconnect() {
        this.client?.deactivate();
        this.client = null;
    }

    isConnected(): boolean {
        return this.client?.connected ?? false;
    }
}

export const wsService = new WebSocketService();
