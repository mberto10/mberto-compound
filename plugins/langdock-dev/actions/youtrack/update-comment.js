// name = YouTrack Update Comment
// description = Aktualisiert einen bestehenden Kommentar auf einem YouTrack-Issue.
//
// issue_id = Lesbare YouTrack-ID, z.B. "AI-74" (Required)
// comment_id = YouTrack Kommentar-ID, z.B. "4-443828" (Required)
// text = Neuer Kommentartext (Required)
// uses_markdown = Ob Markdown verwendet wird (default: true)

const BASE_URL = 'https://fazit.youtrack.cloud/api';
const issueId = (data.input.issueId || data.input.issue_id || '').toString().trim();
const commentId = (data.input.commentId || data.input.comment_id || '').toString().trim();
const text = (data.input.text || '').toString();
const usesMarkdown = data.input.usesMarkdown !== false && data.input.uses_markdown !== false;

if (!issueId) {
  return {
    error: true,
    message: 'issue_id ist erforderlich',
  };
}

if (!commentId) {
  return {
    error: true,
    message: 'comment_id ist erforderlich',
  };
}

if (!text.trim()) {
  return {
    error: true,
    message: 'text ist erforderlich',
  };
}

try {
  const response = await ld.request({
    url: `${BASE_URL}/issues/${encodeURIComponent(issueId)}/comments/${encodeURIComponent(commentId)}?fields=${encodeURIComponent('id,text,created,updated,author(name,login,fullName)')}`,
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.auth.apiKey}`,
    },
    body: {
      text,
      usesMarkdown,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    return {
      error: true,
      status: response.status,
      message: `YouTrack API Fehler beim Aktualisieren von Kommentar ${commentId}`,
      details: response.text || null,
    };
  }

  const comment = response.json || {};
  return {
    success: true,
    issueId,
    comment: {
      id: comment.id || commentId,
      author: comment.author ? (comment.author.fullName || comment.author.name || comment.author.login || null) : null,
      created: comment.created || null,
      updated: comment.updated || null,
      text: comment.text || text,
    },
    metadata: {
      source: 'YouTrack',
      timestamp: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: `Kommentar ${commentId} konnte nicht aktualisiert werden`,
    details: error.message,
  };
}
