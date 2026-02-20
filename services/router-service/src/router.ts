import { RouterPayload } from './types';

// This service receives events from the application, determines the appropriate notification channel (email or SMS)
export function routeEvent(payload: RouterPayload) {
  const eventType = payload.event;

  let targetQueue: string;
  // Determine the target queue based on the event type
  switch (eventType) {
    case 'sms':
      return (targetQueue = 'sms-notifications');
    default:
      return (targetQueue = 'email-notifications');
  }
}
