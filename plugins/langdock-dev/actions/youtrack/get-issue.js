// name = YouTrack Get Issue
// description = Liest ein einzelnes YouTrack-Issue mit Beschreibung und wichtigen Custom Fields.
//
// issue_id = Lesbare YouTrack-ID, z.B. "AI-74" (Required)
// fields = Optionale YouTrack-Feldliste; bei leer wird eine Default-Feldliste verwendet
// max_description_chars = Maximale Laenge der zurueckgegebenen Beschreibung (default: 10000)

const BASE_URL = 'https://fazit.youtrack.cloud/api';
const issueId = (data.input.issueId || data.input.issue_id || '').toString().trim();
const maxDescriptionRaw = Number(data.input.maxDescriptionChars || data.input.max_description_chars || 10000);
const maxDescriptionChars = Math.max(200, Math.min(50000, Number.isFinite(maxDescriptionRaw) ? maxDescriptionRaw : 10000));
const fieldsInput = (data.input.fields || '').toString().trim();
const fields = fieldsInput || 'idReadable,summary,description,created,updated,reporter(name,login,fullName),assignee(name,login,fullName),customFields(name,value(name,login,fullName)),tags(name)';

if (!issueId) {
  return {
    error: true,
    message: 'issue_id ist erforderlich',
  };
}

function extractCustomFields(issue) {
  const customFields = {};
  const source = Array.isArray(issue.customFields) ? issue.customFields : [];

  for (const field of source) {
    const name = field && field.name ? field.name : null;
    const value = field ? field.value : null;
    if (!name || value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      customFields[name] = value.map((item) => {
        if (item && typeof item === 'object') {
          return item.name || item.fullName || item.login || item.idReadable || String(item.id || '');
        }
        return String(item);
      }).filter(Boolean);
      continue;
    }

    if (typeof value === 'object') {
      customFields[name] = value.name || value.fullName || value.login || value.idReadable || value.text || value.id || null;
      continue;
    }

    customFields[name] = value;
  }

  return customFields;
}

try {
  const response = await ld.request({
    url: `${BASE_URL}/issues/${encodeURIComponent(issueId)}?fields=${encodeURIComponent(fields)}`,
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
      message: `YouTrack API Fehler beim Lesen von ${issueId}`,
      details: response.text || null,
    };
  }

  const issue = response.json || {};
  const customFields = extractCustomFields(issue);
  const tags = Array.isArray(issue.tags) ? issue.tags.map((tag) => tag && tag.name ? tag.name : null).filter(Boolean) : [];

  return {
    issue: {
      id: issue.idReadable || issueId,
      summary: issue.summary || '',
      description: (issue.description || '').slice(0, maxDescriptionChars),
      created: issue.created || null,
      updated: issue.updated || null,
      reporter: issue.reporter ? (issue.reporter.fullName || issue.reporter.name || issue.reporter.login || null) : null,
      assignee: issue.assignee ? (issue.assignee.fullName || issue.assignee.name || issue.assignee.login || null) : null,
      tags,
      fields: customFields,
    },
    metadata: {
      source: 'YouTrack',
      timestamp: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: `Issue ${issueId} konnte nicht gelesen werden`,
    details: error.message,
  };
}
