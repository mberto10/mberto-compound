// name = YouTrack Health Check Epics
// description = Prueft aktive YouTrack-Epics auf fehlende Beschreibung, Meilensteine, Bearbeiter und veraltete KW-Updates.
//
// team_member = Optionaler Bearbeiter-Filter
// stale_weeks = Ab wie vielen Wochen ein KW-Update als veraltet gilt (default: 2)
// limit = Maximale Anzahl aktiver Epics zwischen 1 und 100 (default: 50)
// query = Optionale YouTrack-Suchanfrage fuer aktive Epics

const BASE_URL = 'https://fazit.youtrack.cloud/api';
const teamMember = (data.input.teamMember || data.input.team_member || '').toString().trim();
const staleWeeksRaw = Number(data.input.staleWeeks || data.input.stale_weeks || 2);
const staleWeeks = Math.max(1, Math.min(26, Number.isFinite(staleWeeksRaw) ? staleWeeksRaw : 2));
const limitRaw = Number(data.input.limit || 50);
const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? limitRaw : 50));
const query = (data.input.query || 'project: AI Type: Story State: Projektticket').toString().trim();

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

function isKwComment(text) {
  const normalized = (text || '').toString();
  return /\bKW\s*\d{1,2}\b/i.test(normalized) && (/\*\*Updates:\*\*/i.test(normalized) || /\bUpdate\b/i.test(normalized));
}

function weeksAgo(timestamp) {
  if (!timestamp) {
    return null;
  }
  const diffMs = Date.now() - timestamp;
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

try {
  const response = await ld.request({
    url: `${BASE_URL}/issues?query=${encodeURIComponent(query)}&fields=${encodeURIComponent('idReadable,summary,description,customFields(name,value(name,login,fullName)),comments(id,text,created)')}&$top=${limit}`,
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
      message: 'YouTrack API Fehler beim Health Check der Epics',
      details: response.text || null,
    };
  }

  const issues = Array.isArray(response.json) ? response.json : [];
  const staleCutoffWeeks = staleWeeks;
  const inspected = [];
  const missingDescription = [];
  const missingMilestones = [];
  const missingBearbeiter = [];
  const staleUpdates = [];
  const healthy = [];

  for (const issue of issues) {
    const fields = parseCustomFields(issue);
    const bearbeiter = fields.Bearbeiter || fields.Assignee || null;

    if (teamMember && (!bearbeiter || !String(bearbeiter).toLowerCase().includes(teamMember.toLowerCase()))) {
      continue;
    }

    const description = (issue.description || '').toString();
    const comments = Array.isArray(issue.comments) ? issue.comments : [];
    const latestKwComment = comments
      .filter((comment) => isKwComment(comment && comment.text ? comment.text : ''))
      .sort((a, b) => (b.created || 0) - (a.created || 0))[0] || null;

    const latestKwWeeksAgo = latestKwComment ? weeksAgo(latestKwComment.created || 0) : null;
    const hasProjektziel = /projektziel/i.test(description);
    const hasMilestones = /meilenstein/i.test(description) || /\bKW\s*\d{1,2}\b/.test(description) || /\|\s*Meilenstein/i.test(description);

    const epicInfo = {
      id: issue.idReadable || null,
      summary: issue.summary || '',
      bearbeiter,
      latestKwUpdateWeeksAgo: latestKwWeeksAgo,
      latestKwUpdateCreated: latestKwComment ? latestKwComment.created || null : null,
    };

    const issueFlags = [];

    if (!hasProjektziel && description.trim().length < 50) {
      missingDescription.push(epicInfo);
      issueFlags.push('missing_description');
    }

    if (!hasMilestones) {
      missingMilestones.push(epicInfo);
      issueFlags.push('missing_milestones');
    }

    if (!bearbeiter) {
      missingBearbeiter.push(epicInfo);
      issueFlags.push('missing_bearbeiter');
    }

    if (latestKwWeeksAgo === null || latestKwWeeksAgo >= staleCutoffWeeks) {
      staleUpdates.push({
        ...epicInfo,
        staleReason: latestKwWeeksAgo === null ? 'never_updated' : `${latestKwWeeksAgo}_weeks_old`,
      });
      issueFlags.push('stale_update');
    }

    inspected.push({
      ...epicInfo,
      issues: issueFlags,
    });

    if (issueFlags.length === 0) {
      healthy.push(epicInfo);
    }
  }

  return {
    filter: teamMember || null,
    summary: {
      totalEpics: inspected.length,
      healthy: healthy.length,
      withIssues: inspected.length - healthy.length,
      missingDescription: missingDescription.length,
      missingMilestones: missingMilestones.length,
      missingBearbeiter: missingBearbeiter.length,
      staleUpdates: staleUpdates.length,
      staleWeeksThreshold: staleWeeks,
    },
    missingDescription,
    missingMilestones,
    missingBearbeiter,
    staleUpdates,
    healthy,
    inspected,
    metadata: {
      source: 'YouTrack',
      timestamp: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'Epic Health Check fehlgeschlagen',
    details: error.message,
  };
}
