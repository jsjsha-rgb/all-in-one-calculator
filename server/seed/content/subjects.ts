import type { SeedSubject } from '../types';

export const subjects: SeedSubject[] = [
  {
    id: 'polity',
    name: 'Indian Polity & Governance',
    syllabusSection: 'GS Paper II',
    description:
      'Constitutional design, institutions of the Union and States, federalism, rights and accountability.',
    accent: 'teal',
    sortOrder: 1,
  },
  {
    id: 'history',
    name: 'Indian History & Culture',
    syllabusSection: 'GS Paper I',
    description:
      'Ancient, medieval and modern India, the freedom struggle, art and architecture, and cultural continuity.',
    accent: 'amber',
    sortOrder: 2,
  },
  {
    id: 'geography',
    name: 'Geography',
    syllabusSection: 'GS Paper I',
    description:
      'Physical geography, Indian resources, population, and the human-environment interface.',
    accent: 'blue',
    sortOrder: 3,
  },
  {
    id: 'economy',
    name: 'Indian Economy',
    syllabusSection: 'GS Paper III',
    description:
      'Growth, monetary and fiscal policy, budgeting, financial markets, inclusion and external trade.',
    accent: 'green',
    sortOrder: 4,
  },
  {
    id: 'environment',
    name: 'Environment & Ecology',
    syllabusSection: 'GS Paper III',
    description:
      'Ecosystems, biodiversity conservation, climate governance, pollution, and environmental law.',
    accent: 'olive',
    sortOrder: 5,
  },
  {
    id: 'science-tech',
    name: 'Science & Technology',
    syllabusSection: 'GS Paper III',
    description:
      'Biotechnology, space, energy, digital policy, health innovation and emerging technologies.',
    accent: 'indigo',
    sortOrder: 6,
  },
  {
    id: 'ethics',
    name: 'Ethics, Integrity & Aptitude',
    syllabusSection: 'GS Paper IV',
    description:
      'Values in public service, ethical reasoning, emotional intelligence and case-study decision making.',
    accent: 'rose',
    sortOrder: 7,
  },
];
