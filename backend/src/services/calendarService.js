const { google } = require('googleapis');

// Construct Google OAuth2 Client securely via pure JavaScript logic
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/google/callback'
);

// Inject refresh token generated from Google Cloud Console mapped to environment
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Automatically creates a Google Calendar event dynamically embedding a Hangouts Google Meet link
 */
exports.createInterviewEvent = async ({ teamName, leaderEmail, startTime, durationMinutes = 30 }) => {
  try {
    const end = new Date(new Date(startTime).getTime() + durationMinutes * 60000);

    const event = {
      summary: `Final Interview: Team ${teamName} - HireStorm Pipeline`,
      description: 'Your final technical round for the 90-Day Internship pipeline. Be prepared to present your Phase 2 Github repository.',
      start: { dateTime: new Date(startTime).toISOString(), timeZone: 'Asia/Kolkata' },
      end:   { dateTime: end.toISOString(), timeZone: 'Asia/Kolkata' },
      attendees: [{ email: leaderEmail }],
      conferenceData: {
        createRequest: {
          requestId: `interview-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1, // Crucial for auto-generating the Google Meet Link string
      sendUpdates: 'all'        // Programmatically sends standard Google Cal invites as fallback
    });

    return {
      eventId: response.data.id,
      meetLink: response.data.hangoutLink,
      htmlLink: response.data.htmlLink // Raw link to add event to their personal calendar UI
    };
  } catch (error) {
    console.error('[CalendarService] Error creating Meet event:', error.message);
    throw error;
  }
};
