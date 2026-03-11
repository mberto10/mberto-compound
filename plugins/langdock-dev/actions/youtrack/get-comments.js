// name = YouTrack Get Comments
// description = Liest Kommentare eines YouTrack-Issues und kann optional nur KW-Kommentare zurueckgeben.
//
// issue_id = Lesbare YouTrack-ID, z.B. "AI-74" (Required)
// limit = Maximale Anzahl Kommentare zwischen 1 und 200 (default: 100)
// full_text = Gibt den vollstaendigen Kommentartext zurueck (default: false)
// kw_only = Filtert auf KW-Kommentare (default: false)
// latest_first = Sortiert neueste Kommentare zuerst (default: true)
// preview_chars = Zeichenlimit fuer Vorschau, wenn full_text=false (default: 500)

const BASE_URL = 'https://fazit.youtrack.cloud/api';
const issueId = (data.input.issueId || data.input.issue_id || '').toString().trim();
const limitRaw = Number(data.input.limit || 100);
const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 100));
const fullText = data.input.fullText === true || data.input.full_text === true;
const kwOnly = data.input.kwOnly === true || data.input.kw_only === true;
const latestFirst = data.input.latestFirst !== false && data.input.latest_first !== false;
const previewCharsRaw = Number(data.input.previewChars || data.input.preview_chars || 500);
const previewChars = Math.max(100, Math.min(10000, Number.isFinite(previewCharsRaw) ? previewCharsRaw : 500));

if (!issueId) {
  return {
    error: true,
    message: 'issue_id ist erforderlich',
  };
}

function isKwComment(text) {
  const normalized = (text || '').toString();
  return /\bKW\s*\d{1,2}\b/i.test(normalized) || /\bKW\s*\d{1,2}\s*-\s*\d{1,2}\b/i.test(normalized);
}

try {
  const response = await ld.request({
    url: `${BASE_URL}/issues/${encodeURIComponent(issueId)}/comments?fields=${encodeURIComponent('id,text,created,updated,author(name,login,fullName)')}&$top=${limit}`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${data.auth.apiKey}`,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    return {
      error: true,
      status: response.status,
      message: `YouTrack API Fehler beim Lesen der Kommentare von ${issueId}`,
      details: response.text || null,
    };
  }

  let comments = Array.isArray(response.json) ? response.json : [];

  if (kwOnly) {
    comments = comments.filter((comment) => isKwComment(comment && comment.text ? comment.text : ''));
  }

  comments = comments
    .slice()
    .sort((a, b) => {
      const aTime = a && a.created ? a.created : 0;
      const bTime = b && b.created ? b.created : 0;
      return latestFirst ? bTime - aTime : aTime - bTime;
    })
    .map((comment) => ({
      id: comment.id || null,
      author: comment.author ? (comment.author.fullName || comment.author.name || comment.author.login || null) : null,
      created: comment.created || null,
      updated: comment.updated || null,
      text: fullText ? (comment.text || '') : (comment.text || '').slice(0, previewChars),
      isKwComment: isKwComment(comment && comment.text ? comment.text : ''),
    }));

  return {
    issueId,
    count: comments.length,
    comments,
    metadata: {
      source: 'YouTrack',
      timestamp: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: `Kommentare fuer ${issueId} konnten nicht gelesen werden`,
    details: error.message,
  };
}
