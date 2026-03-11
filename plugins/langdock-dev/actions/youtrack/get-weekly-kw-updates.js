// name = YouTrack Get Weekly KW Updates
// description = Sammelt KW-Kommentare aktiver Epic-Tickets fuer eine Kalenderwoche und parst Updates, Blocker und Next Steps.
//
// kw = Kalenderwoche 1-53; wenn leer wird die aktuelle ISO-KW verwendet
// limit = Maximale Anzahl aktiver Epics zwischen 1 und 100 (default: 50)
// query = Optionale YouTrack-Suchanfrage fuer die Epic-Auswahl (default: 'project: AI Type: Story State: Projektticket')
// include_all_comments = Gibt pro Projekt alle passenden KW-Kommentare zurueck statt nur den neuesten Fokus (default: true)

const BASE_URL = 'https://fazit.youtrack.cloud/api';
const kwInput = (data.input.kw || '').toString().trim();
const limitRaw = Number(data.input.limit || 50);
const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? limitRaw : 50));
const query = (data.input.query || 'project: AI Type: Story State: Projektticket').toString().trim();
const includeAllComments = data.input.includeAllComments !== false && data.input.include_all_comments !== false;

function getIsoWeek(now) {
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

const currentKw = getIsoWeek(new Date());
const kw = kwInput ? Number(kwInput) : currentKw;

if (!Number.isInteger(kw) || kw < 1 || kw > 53) {
  return {
    error: true,
    message: 'kw muss zwischen 1 und 53 liegen',
  };
}

function parseCustomFields(issue) {
  const customFields = {};
  const source = Array.isArray(issue.customFields) ? issue.customFields : [];

  for (const field of source) {
    const name = field && field.name ? field.name : null;
    const value = field ? field.value : null;
    if (!name || value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      customFields[name] = value.map((item) => item && typeof item === 'object' ? (item.name || item.fullName || item.login || null) : String(item)).filter(Boolean);
      continue;
    }

    if (typeof value === 'object') {
      customFields[name] = value.name || value.fullName || value.login || value.idReadable || null;
      continue;
    }

    customFields[name] = value;
  }

  return customFields;
}

function matchesKw(text, kwNumber) {
  const normalized = (text || '').toString();
  const pattern = new RegExp(`\\bKW\\s*0?${kwNumber}\\b|\\bKW\\s*${String(kwNumber).padStart(2, '0')}\\b`, 'i');
  return pattern.test(normalized);
}

function splitBulletSection(raw) {
  return (raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function parseBlockerSection(text) {
  const blockerMatch = text.match(/\*\*Blocker:\*\*\s*([\s\S]*?)(?:\n\s*\*\*[A-Za-z ]+:\*\*|$)/i);
  if (!blockerMatch) {
    return {
      raw: null,
      items: [],
      hasActiveBlocker: false,
    };
  }

  const raw = blockerMatch[1].trim();
  const items = splitBulletSection(raw);
  const normalized = raw.replace(/^[-*]\s*/, '').trim().toLowerCase();
  const hasActiveBlocker = normalized && normalized !== 'keine';

  return {
    raw,
    items: items.length > 0 ? items : (raw ? [raw] : []),
    hasActiveBlocker,
  };
}

function parseKwComment(comment) {
  const text = (comment && comment.text ? comment.text : '').toString();
  const updatesMatch = text.match(/\*\*Updates:\*\*\s*([\s\S]*?)(?:\n\s*\*\*Blocker:\*\*|$)/i);
  const nextStepsMatch = text.match(/\*\*Next Steps:\*\*\s*([\s\S]*?)$/i);
  const blocker = parseBlockerSection(text);

  return {
    id: comment.id || null,
    created: comment.created || null,
    author: comment.author ? (comment.author.fullName || comment.author.name || comment.author.login || null) : null,
    text,
    updates: splitBulletSection(updatesMatch ? updatesMatch[1] : ''),
    blocker: blocker.raw,
    blockerItems: blocker.items,
    hasActiveBlocker: blocker.hasActiveBlocker,
    nextSteps: splitBulletSection(nextStepsMatch ? nextStepsMatch[1] : ''),
  };
}

try {
  const epicResponse = await ld.request({
    url: `${BASE_URL}/issues?query=${encodeURIComponent(query)}&fields=${encodeURIComponent('idReadable,summary,description,customFields(name,value(name,login,fullName))')}&$top=${limit}`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${data.auth.apiKey}`,
    },
  });

  if (epicResponse.status < 200 || epicResponse.status >= 300) {
    return {
      error: true,
      status: epicResponse.status,
      message: 'YouTrack API Fehler beim Laden der aktiven Epics',
      details: epicResponse.text || null,
    };
  }

  const epics = Array.isArray(epicResponse.json) ? epicResponse.json : [];
  const projects = [];

  for (const epic of epics) {
    const issueId = epic.idReadable || null;
    if (!issueId) {
      continue;
    }

    const commentsResponse = await ld.request({
      url: `${BASE_URL}/issues/${encodeURIComponent(issueId)}/comments?fields=${encodeURIComponent('id,text,created,author(name,login,fullName)')}&$top=100`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${data.auth.apiKey}`,
      },
    });

    if (commentsResponse.status < 200 || commentsResponse.status >= 300) {
      projects.push({
        project: epic.summary || issueId,
        ticketId: issueId,
        error: true,
        message: `Kommentare fuer ${issueId} konnten nicht geladen werden`,
        status: commentsResponse.status,
      });
      continue;
    }

    const comments = Array.isArray(commentsResponse.json) ? commentsResponse.json : [];
    const kwComments = comments
      .filter((comment) => matchesKw(comment && comment.text ? comment.text : '', kw))
      .map(parseKwComment)
      .sort((a, b) => (b.created || 0) - (a.created || 0));

    if (kwComments.length === 0) {
      continue;
    }

    const customFields = parseCustomFields(epic);
    projects.push({
      project: epic.summary || issueId,
      ticketId: issueId,
      state: customFields.State || null,
      bearbeiter: customFields.Bearbeiter || customFields.Assignee || null,
      support: customFields.Support || [],
      latestComment: kwComments[0],
      comments: includeAllComments ? kwComments : [kwComments[0]],
      commentCount: kwComments.length,
      hasActiveBlocker: kwComments.some((comment) => comment.hasActiveBlocker),
    });
  }

  return {
    kw,
    totalProjects: projects.length,
    projects,
    metadata: {
      source: 'YouTrack',
      query,
      timestamp: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'KW-Updates konnten nicht geladen werden',
    details: error.message,
  };
}
