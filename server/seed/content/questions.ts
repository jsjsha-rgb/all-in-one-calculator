import type { SeedQuestion } from '../types';
import { PYQ_STYLE_LABEL, SAMPLE_LABEL } from '../types';

export const questions: SeedQuestion[] = [
  // ---------------- Polity ----------------
  {
    id: 'q-pol-01',
    subjectId: 'polity',
    topic: 'Constitutional Framework',
    examYear: null,
    questionText:
      'The words "socialist", "secular" and "integrity of the nation" were added to the Preamble by which amendment?',
    options: ['24th Amendment', '42nd Amendment', '44th Amendment', '52nd Amendment'],
    correctAnswer: 1,
    explanation:
      'The 42nd Constitutional Amendment Act, 1976 inserted "socialist" and "secular" into the Preamble and changed "unity of the nation" to "unity and integrity of the nation". The 44th Amendment later reversed several other changes made during the Emergency, but not these Preamble words.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-pol-02',
    subjectId: 'polity',
    topic: 'Parliament',
    examYear: 2023,
    questionText:
      'With reference to a Money Bill, consider the following statements:\n1. It can be introduced only in the Lok Sabha.\n2. The Rajya Sabha must return it within 14 days with or without recommendations.\n3. The Speaker of the Lok Sabha certifies whether a Bill is a Money Bill.\nWhich of the statements are correct?',
    options: ['1 and 2 only', '2 and 3 only', '1 and 3 only', '1, 2 and 3'],
    correctAnswer: 3,
    explanation:
      'All three statements are correct. Article 110 defines a Money Bill, Article 109 sets the 14-day limit for the Rajya Sabha, and Article 110(3) gives the Speaker the final word on certification. The Rajya Sabha can make recommendations, which the Lok Sabha may accept or reject.',
    difficulty: 'medium',
    source: PYQ_STYLE_LABEL,
    questionType: 'pyq-style',
  },
  {
    id: 'q-pol-03',
    subjectId: 'polity',
    topic: 'Judiciary',
    examYear: null,
    questionText:
      'The basic structure doctrine, which limits the amending power of Parliament, was laid down in which case?',
    options: [
      'Golaknath v. State of Punjab',
      'Kesavananda Bharati v. State of Kerala',
      'Minerva Mills v. Union of India',
      'Maneka Gandhi v. Union of India',
    ],
    correctAnswer: 1,
    explanation:
      'Kesavananda Bharati (1973) held that Parliament can amend the Constitution but cannot destroy its basic structure. Minerva Mills (1980) applied and expanded the doctrine. Golaknath (1967) had taken a different view on fundamental rights, and Maneka Gandhi concerned personal liberty.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-pol-04',
    subjectId: 'polity',
    topic: 'Fundamental Duties',
    examYear: null,
    questionText: 'Which of the following is NOT a Fundamental Duty under Article 51A?',
    options: [
      'To protect and improve the natural environment',
      'To develop the scientific temper, humanism and the spirit of inquiry',
      'To pay taxes honestly and on time',
      'To provide opportunities for education to children between 6 and 14 years',
    ],
    correctAnswer: 2,
    explanation:
      'Paying taxes was recommended by the Swaran Singh Committee but was not included in Article 51A. The other three are listed duties; the duty to provide education opportunities to children aged 6-14 was added by the 86th Amendment in 2002.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-pol-05',
    subjectId: 'polity',
    topic: 'Parliament',
    examYear: 2022,
    questionText:
      'Which of the following can be introduced ONLY in the Lok Sabha?\n1. A Money Bill\n2. A no-confidence motion\n3. A constitutional amendment Bill',
    options: ['1 only', '1 and 2 only', '2 and 3 only', '1, 2 and 3'],
    correctAnswer: 1,
    explanation:
      'Money Bills can originate only in the Lok Sabha (Article 109), and a no-confidence motion can be moved only in the Lok Sabha. A constitutional amendment Bill can be introduced in either House; it requires a special majority in each House separately, with no joint sitting.',
    difficulty: 'medium',
    source: PYQ_STYLE_LABEL,
    questionType: 'pyq-style',
  },

  // ---------------- History ----------------
  {
    id: 'q-his-01',
    subjectId: 'history',
    topic: 'Freedom Movement',
    examYear: null,
    questionText: 'The Dandi March of 1930 was launched as a protest against:',
    options: [
      'The partition of Bengal',
      'The Rowlatt Act',
      'The salt tax and the colonial monopoly on salt',
      'The Simon Commission',
    ],
    correctAnswer: 2,
    explanation:
      'Gandhi began the march from Sabarmati Ashram on 12 March 1930 to Dandi, where he broke the salt law on 6 April. It inaugurated the Civil Disobedience Movement. The partition of Bengal (1905) and the Rowlatt Act (1919) were earlier flashpoints, and the Simon Commission was boycotted in 1928.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-his-02',
    subjectId: 'history',
    topic: 'National Movement',
    examYear: null,
    questionText:
      'The Non-Cooperation Movement was suspended by Gandhi in 1922 following which event?',
    options: [
      'The Jallianwala Bagh massacre',
      'The Chauri Chaura incident',
      'The withdrawal of the Khilafat demand',
      'The arrest of Jawaharlal Nehru',
    ],
    correctAnswer: 1,
    explanation:
      'At Chauri Chaura in February 1922, a crowd set fire to a police station, killing constables. Gandhi, committed to non-violence, suspended the movement. Jallianwala Bagh occurred in 1919, before the movement began.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-his-03',
    subjectId: 'history',
    topic: 'Ancient India',
    examYear: 2024,
    questionText:
      'With reference to Ashokan inscriptions, consider the following statements:\n1. Dhamma-mahamattas were officers appointed to promote public ethics and welfare.\n2. The edicts were written exclusively in Pali.\n3. Ashoka sent missions to Sri Lanka and to Hellenistic kingdoms.\nWhich of the statements are correct?',
    options: ['1 and 3 only', '1 and 2 only', '2 and 3 only', '1, 2 and 3'],
    correctAnswer: 0,
    explanation:
      'Statements 1 and 3 are correct. The edicts use several languages and scripts, including Prakrit in Brahmi, Kharoshthi in the northwest, and Greek and Aramaic in some frontier areas, so statement 2 is false.',
    difficulty: 'medium',
    source: PYQ_STYLE_LABEL,
    questionType: 'pyq-style',
  },
  {
    id: 'q-his-04',
    subjectId: 'history',
    topic: 'National Movement',
    examYear: null,
    questionText:
      'The Lucknow Pact of 1916 is significant because it:',
    options: [
      'Created separate electorates for the first time',
      'Brought the Moderates and Extremists together and arranged Congress-League cooperation',
      'Launched the Quit India Movement',
      'Established the partition of Bengal',
    ],
    correctAnswer: 1,
    explanation:
      'The Lucknow session reunited the Moderates and Extremists after the 1907 Surat split and produced an understanding between the Congress and the Muslim League. Separate electorates had been introduced by the Morley-Minto reforms of 1909, not by this pact.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-his-05',
    subjectId: 'history',
    topic: 'Art and Culture',
    examYear: null,
    questionText:
      'Which of the following statements about the Ajanta caves is correct?',
    options: [
      'They are primarily Jain cave temples',
      'They contain Buddhist paintings executed over several centuries',
      'They were built entirely during the Mauryan period',
      'They are located in the Eastern Ghats of Andhra Pradesh',
    ],
    correctAnswer: 1,
    explanation:
      'The Ajanta caves in Maharashtra are Buddhist monastic complexes with paintings and sculpture from roughly the 2nd century BCE to the 5th-6th century CE. They are not Jain temples, not exclusively Mauryan, and not in Andhra Pradesh. Ellora, nearby, includes Buddhist, Hindu and Jain caves.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },

  // ---------------- Geography ----------------
  {
    id: 'q-geo-01',
    subjectId: 'geography',
    topic: 'Climate',
    examYear: null,
    questionText:
      'The rain-shadow region of the Western Ghats lies mainly:',
    options: [
      'To the west of the Ghats, facing the Arabian Sea',
      'To the east of the Ghats, in the Deccan interior',
      'Along the Konkan coast',
      'In the Himalayan foothills',
    ],
    correctAnswer: 1,
    explanation:
      'The south-west monsoon strikes the windward western slopes, causing heavy orographic rainfall. As air descends on the eastern side it warms and dries, creating a rain shadow in the Deccan interior. The Konkan coast is on the windward side.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-geo-02',
    subjectId: 'geography',
    topic: 'Agriculture',
    examYear: 2023,
    questionText:
      'Which of the following are kharif crops?\n1. Rice\n2. Wheat\n3. Cotton\n4. Mustard',
    options: ['1 and 3 only', '2 and 4 only', '1, 2 and 3 only', '1, 3 and 4 only'],
    correctAnswer: 0,
    explanation:
      'Kharif crops are sown with the south-west monsoon and harvested in autumn; rice and cotton are examples. Wheat and mustard are rabi crops, sown in winter and harvested in spring.',
    difficulty: 'easy',
    source: PYQ_STYLE_LABEL,
    questionType: 'pyq-style',
  },
  {
    id: 'q-geo-03',
    subjectId: 'geography',
    topic: 'Climate',
    examYear: null,
    questionText: 'A "break in the monsoon" refers to:',
    options: [
      'The complete withdrawal of the monsoon from Kerala',
      'A northward shift of the monsoon trough causing dry spells in parts of central India',
      'The end of the monsoon season in October',
      'A cyclone in the Bay of Bengal',
    ],
    correctAnswer: 1,
    explanation:
      'During a break, the monsoon trough shifts towards the Himalayan foothills. Central and western India may experience dry spells while the northeast and foothills receive heavy rain. Withdrawal is a different seasonal process that begins in September-October.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-geo-04',
    subjectId: 'geography',
    topic: 'Geomorphology',
    examYear: null,
    questionText: 'The Deccan Traps were formed by:',
    options: [
      'Continental collision and folding',
      'Flood basalt volcanism around 66 million years ago',
      'Glacial deposition',
      'Riverine alluvium deposition',
    ],
    correctAnswer: 1,
    explanation:
      'The Deccan Traps are a large igneous province formed by flood basalt eruptions near the Cretaceous-Palaeogene boundary. Weathering of the basalt creates fertile black cotton soil in parts of the plateau.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-geo-05',
    subjectId: 'geography',
    topic: 'Drainage',
    examYear: null,
    questionText: 'Which of the following peninsular rivers flows westwards into the Arabian Sea?',
    options: ['Godavari', 'Krishna', 'Narmada', 'Kaveri'],
    correctAnswer: 2,
    explanation:
      'The Narmada flows west through a rift valley between the Vindhya and Satpura ranges. The Godavari, Krishna and Kaveri flow eastwards into the Bay of Bengal.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },

  // ---------------- Economy ----------------
  {
    id: 'q-eco-01',
    subjectId: 'economy',
    topic: 'Monetary Policy',
    examYear: null,
    questionText: 'The repo rate is the rate at which:',
    options: [
      'Banks lend to their best customers',
      'The RBI lends short-term funds to banks against government securities',
      'The government borrows from the IMF',
      'Banks lend to each other overnight without collateral',
    ],
    correctAnswer: 1,
    explanation:
      'The repo rate is the policy rate at which the RBI provides short-term liquidity to banks against eligible collateral. The marginal standing facility is a penal window above the repo rate, and the reverse repo or SDF absorbs liquidity.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-eco-02',
    subjectId: 'economy',
    topic: 'Public Finance',
    examYear: null,
    questionText: 'Fiscal deficit is best defined as:',
    options: [
      'Total expenditure minus total receipts including borrowings',
      'Total expenditure minus total receipts excluding borrowings',
      'Revenue expenditure minus revenue receipts',
      'Interest payments minus primary deficit',
    ],
    correctAnswer: 1,
    explanation:
      'The fiscal deficit measures the gap between total expenditure and all receipts other than borrowings, so it indicates the government\u2019s borrowing requirement. Revenue deficit is revenue expenditure minus revenue receipts; primary deficit is fiscal deficit minus interest payments.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-eco-03',
    subjectId: 'economy',
    topic: 'Monetary Policy',
    examYear: 2023,
    questionText:
      'Under India\u2019s flexible inflation-targeting framework, consider the following statements:\n1. The inflation target is 4 percent with a tolerance band of 2 to 6 percent.\n2. The Monetary Policy Committee has six members.\n3. The target is expressed in terms of wholesale price inflation.\nWhich of the statements are correct?',
    options: ['1 and 2 only', '2 and 3 only', '1 and 3 only', '1, 2 and 3'],
    correctAnswer: 0,
    explanation:
      'The target is defined in terms of Consumer Price Index (CPI) inflation, not WPI, so statement 3 is incorrect. The target is 4 percent with a 2-6 percent band, and the MPC has six members, three from the RBI and three appointed by the government.',
    difficulty: 'medium',
    source: PYQ_STYLE_LABEL,
    questionType: 'pyq-style',
  },
  {
    id: 'q-eco-04',
    subjectId: 'economy',
    topic: 'Banking',
    examYear: null,
    questionText: 'Cash Reserve Ratio (CRR) refers to:',
    options: [
      'The share of deposits banks must hold in approved securities',
      'The share of net demand and time liabilities banks must keep as cash with the RBI',
      'The capital that banks must maintain against risk-weighted assets',
      'The interest rate on government securities',
    ],
    correctAnswer: 1,
    explanation:
      'CRR is the proportion of net demand and time liabilities that banks must maintain as cash balances with the RBI. Holdings of approved securities are the SLR, and capital against risk-weighted assets is the capital adequacy ratio.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-eco-05',
    subjectId: 'economy',
    topic: 'Public Finance',
    examYear: null,
    questionText:
      'If the fiscal deficit is Rs 12 lakh crore and interest payments are Rs 4 lakh crore, the primary deficit is:',
    options: ['Rs 16 lakh crore', 'Rs 8 lakh crore', 'Rs 4 lakh crore', 'Rs 3 lakh crore'],
    correctAnswer: 1,
    explanation:
      'Primary deficit = fiscal deficit minus interest payments = 12 - 4 = Rs 8 lakh crore. It indicates current borrowing needs excluding the inherited interest burden.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },

  // ---------------- Environment ----------------
  {
    id: 'q-env-01',
    subjectId: 'environment',
    topic: 'Biodiversity',
    examYear: null,
    questionText:
      'Which of the following statements is correct with respect to India\u2019s protected areas?',
    options: [
      'A national park always permits grazing by local communities',
      'A community reserve is notified under the Wild Life (Protection) Act to involve local communities',
      'A biosphere reserve is a category created by the Wildlife Protection Act, 1972',
      'A wildlife sanctuary cannot be created inside a reserved forest',
    ],
    correctAnswer: 1,
    explanation:
      'The 2003 amendment to the Wild Life (Protection) Act created conservation reserves and community reserves, with community involvement. Biosphere reserves are designated under UNESCO\u2019s programme, not the Wildlife Protection Act. Grazing is not permitted in a national park by default, and sanctuaries can overlap reserved forests.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-env-02',
    subjectId: 'environment',
    topic: 'Climate Governance',
    examYear: null,
    questionText:
      'The "30x30" target associated with the Kunming-Montreal Global Biodiversity Framework aims to:',
    options: [
      'Reduce carbon emissions by 30 percent by 2030',
      'Protect at least 30 percent of terrestrial and marine areas by 2030',
      'Restore 30 percent of all wetlands by 2030',
      'Limit global warming to 3.0 degrees Celsius',
    ],
    correctAnswer: 1,
    explanation:
      'The framework, adopted under the Convention on Biological Diversity in 2022, includes a target to conserve at least 30 percent of land and inland waters and 30 percent of coastal and marine areas by 2030. It is a biodiversity target, not an emissions target.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-env-03',
    subjectId: 'environment',
    topic: 'Climate Governance',
    examYear: 2024,
    questionText:
      'Consider the following statements about the Paris Agreement:\n1. It was adopted under the UNFCCC in 2015.\n2. Its emission targets for individual countries are internationally binding.\n3. It aims to keep warming well below 2 degrees Celsius while pursuing efforts to limit it to 1.5 degrees.\nWhich of the statements are correct?',
    options: ['1 and 2 only', '1 and 3 only', '2 and 3 only', '1, 2 and 3'],
    correctAnswer: 1,
    explanation:
      'Statements 1 and 3 are correct. The Paris Agreement is a treaty, but the mitigation contributions are nationally determined rather than internationally binding in the way the Kyoto Protocol targets were. Transparency and review obligations are binding.',
    difficulty: 'medium',
    source: PYQ_STYLE_LABEL,
    questionType: 'pyq-style',
  },
  {
    id: 'q-env-04',
    subjectId: 'environment',
    topic: 'Conservation',
    examYear: null,
    questionText: 'Project Tiger was launched in which year?',
    options: ['1952', '1972', '1973', '1992'],
    correctAnswer: 2,
    explanation:
      'Project Tiger was launched in 1973 to ensure a viable tiger population through habitat protection and management. The Wildlife (Protection) Act was passed in 1972, and Project Elephant began in 1992.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-env-05',
    subjectId: 'environment',
    topic: 'Pollution',
    examYear: null,
    questionText:
      'Which of the following is the primary purpose of the Extended Producer Responsibility (EPR) framework?',
    options: [
      'To shift the cost of managing end-of-life products to producers',
      'To ban all single-use plastics',
      'To subsidise raw material imports',
      'To set ambient air quality standards',
    ],
    correctAnswer: 0,
    explanation:
      'EPR makes producers responsible for the collection and environmentally sound management of their products after use, giving them an incentive to design for recyclability. India applies EPR to plastic packaging and electronic waste, among other streams.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },

  // ---------------- Science & Technology ----------------
  {
    id: 'q-sci-01',
    subjectId: 'science-tech',
    topic: 'Biotechnology',
    examYear: null,
    questionText: 'The polymerase chain reaction (PCR) is used to:',
    options: [
      'Edit specific genes in a living organism',
      'Amplify a specific segment of DNA',
      'Sequence proteins directly',
      'Fuse two animal cells',
    ],
    correctAnswer: 1,
    explanation:
      'PCR copies a targeted DNA segment through repeated cycles of denaturation, primer annealing and extension. Gene editing is a different technique, typically CRISPR-Cas9, and protein sequencing uses other methods.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-sci-02',
    subjectId: 'science-tech',
    topic: 'Space',
    examYear: null,
    questionText:
      'Aditya-L1, India\u2019s solar observatory mission, is positioned:',
    options: [
      'In a low Earth orbit around the equator',
      'Around the Sun-Earth Lagrange point L1',
      'In a geostationary orbit above India',
      'In orbit around the Moon',
    ],
    correctAnswer: 1,
    explanation:
      'Aditya-L1 orbits the Sun-Earth L1 point about 1.5 million km from Earth, giving continuous views of the Sun without Earth occultation. Lagrange points are gravitational equilibrium regions in a two-body system.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-sci-03',
    subjectId: 'science-tech',
    topic: 'Health',
    examYear: null,
    questionText:
      'In mRNA vaccines, the injected mRNA primarily:',
    options: [
      'Integrates into the recipient\u2019s genome',
      'Provides instructions to produce a target antigen',
      'Directly neutralises the pathogen in the bloodstream',
      'Replaces a defective gene in the recipient',
    ],
    correctAnswer: 1,
    explanation:
      'mRNA vaccines deliver genetic instructions that cells use to produce an antigen, which trains the immune system. The mRNA does not enter the nucleus or alter DNA, and it is not itself an antibody or a gene-replacement therapy.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-sci-04',
    subjectId: 'science-tech',
    topic: 'Space',
    examYear: 2024,
    questionText:
      'With reference to Chandrayaan-3, consider the following statements:\n1. It achieved a soft landing near the lunar south pole.\n2. It carried a lander and a rover.\n3. It was India\u2019s first mission to the Moon.\nWhich of the statements are correct?',
    options: ['1 and 2 only', '1 and 3 only', '2 and 3 only', '1, 2 and 3'],
    correctAnswer: 0,
    explanation:
      'Chandrayaan-3, launched in 2023, carried the Vikram lander and Pragyan rover and landed near the lunar south pole. Chandrayaan-1 (2008) was India\u2019s first lunar mission, so statement 3 is incorrect.',
    difficulty: 'easy',
    source: PYQ_STYLE_LABEL,
    questionType: 'pyq-style',
  },
  {
    id: 'q-sci-05',
    subjectId: 'science-tech',
    topic: 'Digital Technology',
    examYear: null,
    questionText:
      'Which of the following statements about NavIC is correct?',
    options: [
      'It is a global navigation system covering the entire Earth',
      'It is a regional navigation satellite system primarily covering India and its neighbourhood',
      'It is a weather satellite series',
      'It is a lunar communication network',
    ],
    correctAnswer: 1,
    explanation:
      'NavIC (Navigation with Indian Constellation) provides positioning and timing services over India and a surrounding region extending beyond the subcontinent. Global systems such as GPS, GLONASS and Galileo have wider coverage.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },

  // ---------------- Ethics ----------------
  {
    id: 'q-eth-01',
    subjectId: 'ethics',
    topic: 'Values in Public Service',
    examYear: null,
    questionText:
      'Which of the following best describes "integrity" in public service?',
    options: [
      'Completing tasks within the available budget',
      'Consistency between espoused values and actual conduct, including honesty and avoidance of corruption',
      'Obeying every instruction from a superior without question',
      'Favouring citizens who are socially disadvantaged',
    ],
    correctAnswer: 1,
    explanation:
      'Integrity is about wholeness between values and behaviour, reflected in honesty, reliability and refusal of corrupt practices. Blind obedience to instructions can conflict with ethical duty, and favouring any group over another violates impartiality.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-eth-02',
    subjectId: 'ethics',
    topic: 'Ethical Reasoning',
    examYear: null,
    questionText:
      'A district officer listens patiently to a flood-affected farmer and expedites relief after verifying eligibility. However, a similarly placed but ineligible applicant is politely refused. Which values are best demonstrated?',
    options: [
      'Empathy but compromised impartiality',
      'Both empathy and impartiality',
      'Neither empathy nor impartiality',
      'Favouritism and efficiency',
    ],
    correctAnswer: 1,
    explanation:
      'Listening and responding to distress demonstrates empathy, while applying eligibility criteria consistently demonstrates impartiality. Empathy does not require granting illegitimate claims; both values can coexist when the decision process is fair.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-eth-03',
    subjectId: 'ethics',
    topic: 'Emotional Intelligence',
    examYear: null,
    questionText:
      'Which of the following is NOT commonly listed as a component of emotional intelligence?',
    options: [
      'Self-awareness',
      'Self-regulation',
      'Empathy',
      'Working memory capacity',
    ],
    correctAnswer: 3,
    explanation:
      'Emotional intelligence frameworks typically include self-awareness, self-regulation, motivation, empathy and social skills. Working memory capacity is a cognitive ability studied separately, not one of the standard EI components.',
    difficulty: 'easy',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
  {
    id: 'q-eth-04',
    subjectId: 'ethics',
    topic: 'Ethical Reasoning',
    examYear: 2022,
    questionText:
      'An action that is legally permissible but gives an undue advantage to a relative in a discretionary appointment appears improper. The best justification for avoiding it is:',
    options: [
      'Legality and propriety are identical in public administration',
      'Public servants must avoid not only impropriety but also the appearance of impropriety',
      'Nepotism is acceptable if the relative is competent',
      'Discretion means decisions cannot be questioned',
    ],
    correctAnswer: 1,
    explanation:
      'Ethical public administration asks whether an action would appear fair to a reasonable observer, not merely whether it is legal. Avoiding the appearance of favouritism protects institutional trust, and discretion remains subject to review.',
    difficulty: 'medium',
    source: PYQ_STYLE_LABEL,
    questionType: 'pyq-style',
  },
  {
    id: 'q-eth-05',
    subjectId: 'ethics',
    topic: 'Case Studies',
    examYear: null,
    questionText:
      'A contractor who has completed a public works project offers an expensive gift to the supervising officer as a token of gratitude. The officer should:',
    options: [
      'Accept it, because the project is complete and no favour is pending',
      'Decline it and record the attempt in accordance with the conduct rules',
      'Accept it but distribute it to the team',
      'Ask for a donation to the officer\u2019s favourite charity instead',
    ],
    correctAnswer: 1,
    explanation:
      'Accepting any gift from a contractor creates a conflict of interest and violates civil-service conduct rules, regardless of whether a favour is pending. Declining and reporting protects the officer and the institution; routing it elsewhere does not remove the ethical problem.',
    difficulty: 'medium',
    source: SAMPLE_LABEL,
    questionType: 'mcq',
  },
];
