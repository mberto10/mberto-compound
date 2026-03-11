// name = YouTrack Search Issues
// description = Sucht Issues in fazit YouTrack per YouTrack-Query und gibt strukturierte Felder zurueck.
//
// query = YouTrack Suchanfrage, z.B. "project: AI State: Projektticket" (Required)
// limit = Maximale Anzahl Ergebnisse zwischen 1 und 100 (default: 30)
// fields = Optionale YouTrack-Feldliste; bei leer wird eine sinnvolle Default-Feldliste verwendet

const BASE_URL = 'https://fazit.youtrack.cloud/api';
const query = (data.input.query || '').toString().trim();
const limitRaw = Number(data.input.limit || 30);
const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? limitRaw : 30));
const fieldsInput = (data.input.fields || '').toString().trim();
const fields = fieldsInput || 'idReadable,summary,description,created,updated,customFields(name,value(name,login,fullName))';

if (!query) {
  return {
    error: true,
    message: 'query ist erforderlich',
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

function summarizeIssue(issue) {
  const customFields = extractCustomFields(issue);
  return {
    id: issue.idReadable || null,
    summary: issue.summary || '',
    descriptionPreview: (issue.description || '').slice(0, 300),
    created: issue.created || null,
    updated: issue.updated || null,
    state: customFields.State || null,
    type: customFields.Type || null,
    bearbeiter: customFields.Bearbeiter || customFields.Assignee || null,
    support: customFields.Support || [],
    fields: customFields,
  };
}

try {
  const response = await ld.request({
    url: `${BASE_URL}/issues?query=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&$top=${limit}`,
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
      message: 'YouTrack API Fehler bei der Issue-Suche',
      details: response.text || null,
    };
  }

  const payload = Array.isArray(response.json) ? response.json : [];
  const issues = payload.map(summarizeIssue);

  return {
    query,
    count: issues.length,
    issues,
    metadata: {
      source: 'YouTrack',
      baseUrl: 'https://fazit.youtrack.cloud',
      timestamp: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'Suche in YouTrack fehlgeschlagen',
    details: error.message,
  };
}
