const JAMB_SUBJECTS = [
  'English Language',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Agricultural Science',
  'Economics',
  'Government',
  'Civic Education',
  'Geography',
  'History',
  'Literature in English',
  'Hausa',
  'Islamic Religious Studies',
  'Accounting',
  'Commerce',
  'Christian Religious Studies',
];

const SUBJECT_ALIASES = {
  'Islamic Studies': 'Islamic Religious Studies',
  'Christian Religious Studies': 'Christian Religious Studies',
};

function normalizeJambSubjects(subjects) {
  if (!Array.isArray(subjects) || subjects.length !== 4) {
    throw new Error('Please select exactly four JAMB subjects.');
  }

  const normalized = subjects.map((subject) => {
    const trimmed = String(subject).trim();
    return SUBJECT_ALIASES[trimmed] || trimmed;
  });

  if (new Set(normalized).size !== 4) {
    throw new Error('JAMB subjects must be distinct.');
  }

  const invalid = normalized.filter((subject) => !JAMB_SUBJECTS.includes(subject));
  if (invalid.length > 0) {
    throw new Error('One or more selections are not valid JAMB subjects.');
  }

  return normalized;
}

module.exports = { JAMB_SUBJECTS, normalizeJambSubjects };
