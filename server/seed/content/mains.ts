import type { SeedMainsQuestion } from '../types';

/** Original sample Mains questions written for this prototype. */
export const mainsQuestions: SeedMainsQuestion[] = [
  {
    id: 'mains-pol-01',
    subjectId: 'polity',
    question:
      'The basic structure doctrine has strengthened constitutionalism in India, but it has also invited criticism for judicial overreach. Examine.',
    marks: 15,
    guidance:
      'Define the doctrine, cite two or three cases, present both the strengthening and overreach arguments, and conclude with a balanced view on judicial restraint and constitutional supremacy.',
    modelAnswer: `The basic structure doctrine, laid down in Kesavananda Bharati (1973), holds that Parliament's amending power under Article 368 cannot be used to destroy the Constitution's essential features. It was applied in Indira Nehru Gandhi (1975) and Minerva Mills (1980).

It strengthens constitutionalism by protecting judicial review, free and fair elections, federalism and secularism against transient majorities. It converts the Constitution from a flexible procedural document into a durable framework of values, and it gives courts a principled basis to review amendments rather than merely their procedure.

Critics argue that the doctrine is textually unmoored, that the list of basic features is open-ended, and that judges can thereby substitute their preferences for those of elected representatives. The counter is that the doctrine is used rarely, requires a demonstrated violation, and protects the conditions under which democratic politics itself operates.

A balanced conclusion treats the doctrine as a necessary but exceptional safeguard, best exercised with reasoned restraint, clear identification of the feature threatened, and deference to legislative policy choices that do not damage constitutional identity.`,
  },
  {
    id: 'mains-eco-01',
    subjectId: 'economy',
    question:
      'Inflation targeting has improved the credibility of monetary policy in India, yet supply-side shocks limit what the RBI can achieve. Discuss.',
    marks: 15,
    guidance:
      'Explain the framework, its credibility gains, transmission constraints, and the limits of demand management when food and fuel prices move. Suggest complementary policies.',
    modelAnswer: `India adopted flexible inflation targeting in 2016, with a 4 percent CPI target and a 2-6 percent band. The framework clarified the RBI's mandate, introduced a Monetary Policy Committee, and improved communication and accountability.

Credibility gains include better-anchored inflation expectations, a clearer reaction function, and a formal reporting mechanism when the band is breached. Lower and more stable inflation supports real incomes and long-term investment planning.

Limits arise from the nature of shocks. Food and fuel prices respond to weather, global markets and supply chains, which monetary policy cannot directly address. Transmission is also uneven because deposit rates reprice slowly and many borrowers are on fixed rates. Aggressive tightening in a supply shock can dampen output without quickly lowering prices.

The implication is not that targeting should be abandoned, but that it must be complemented by supply-side measures: irrigation, storage, logistics, energy diversification and fiscal support targeted at vulnerable households. Coordination between monetary and fiscal policy, and clear communication about the nature of the shock, are essential.`,
  },
  {
    id: 'mains-env-01',
    subjectId: 'environment',
    question:
      'India\u2019s biodiversity conservation model must move from a purely area-based approach to one that values ecological quality and community participation. Critically examine.',
    marks: 15,
    guidance:
      'Contrast coverage with quality, discuss fragmentation and invasive species, explain the role of communities and rights, and offer a balanced way forward.',
    modelAnswer: `India's protected-area network has expanded substantially, but coverage alone is an incomplete measure of conservation success. Many reserves are small, fragmented or understaffed, and invasive species, poaching and human-wildlife conflict persist.

An area-based approach can create paper parks: legal boundaries without ecological management. Quality requires adequate staffing, monitoring, corridor connectivity and restoration. It also requires honest accounting of the opportunity costs borne by forest-dependent communities.

Community participation is not merely consultative. The Forest Rights Act recognises rights and creates a framework for consent in several contexts. Joint forest management, community reserves and locally managed marine areas show that conservation can be designed with, rather than against, local institutions. Where participation is tokenistic, it breeds conflict and undermines compliance.

A stronger model combines quality-focused management, rights-based participation, transparent benefit sharing and stable finance. International targets such as 30x30 should be treated as a floor, with indicators for ecological outcomes and equity, not only hectares notified.`,
  },
  {
    id: 'mains-geo-01',
    subjectId: 'geography',
    question:
      'Discuss how the behaviour of the Indian monsoon shapes cropping patterns, rural incomes and the policy response to rainfall variability.',
    marks: 15,
    guidance:
      'Explain monsoon mechanics briefly, link rainfall timing and distribution to kharif and rabi choices, and evaluate irrigation, insurance and advisory policies.',
    modelAnswer: `The south-west monsoon supplies about three-quarters of India's annual rainfall and drives the agricultural calendar. Kharif crops are sown with monsoon onset, while rabi sowing depends on residual soil moisture, irrigation and winter rain.

Variability operates through total rainfall, timing, and spatial distribution. A late onset can delay sowing; a mid-season break can damage standing crops; an early withdrawal can reduce reservoir storage for rabi. These effects are mediated by irrigation, soil type, crop choice and access to markets.

Rural incomes are exposed not only to yield losses but also to price volatility and debt. Distress sales, migration and reduced spending on health and education follow poor seasons. Women, tenants and landless labourers often bear disproportionate costs.

Policy responses include irrigation expansion, watershed development, drought-resistant varieties, crop insurance, minimum support prices and agro-advisories. Each has limits: irrigation can stress groundwater, insurance faces basis risk, and price support can distort cropping. A resilient strategy combines risk reduction, risk transfer and income support, with local data and inclusive delivery.`,
  },
  {
    id: 'mains-his-01',
    subjectId: 'history',
    question:
      'Assess the role of mass mobilisation in the Indian national movement between 1919 and 1942.',
    marks: 15,
    guidance:
      'Cover the Rowlatt Satyagraha, Non-Cooperation, Civil Disobedience and Quit India, assess reach and limits, and avoid a purely chronological answer.',
    modelAnswer: `Between 1919 and 1942, the national movement shifted from elite petitioning to mass mobilisation. The Rowlatt Satyagraha and Jallianwala Bagh created a moral rupture; Non-Cooperation (1920-22) brought students, lawyers, workers and peasants into a common frame, though it was suspended after Chauri Chaura.

Civil Disobedience from 1930 used the salt tax to make an abstract demand concrete, and it spread through rural defiance of revenue and forest laws. The 1937 provincial elections demonstrated the Congress's organisational reach. Quit India in 1942 showed capacity for rapid, decentralised action, even as leadership was jailed.

Mass mobilisation expanded the social base and linked nationalism with everyday grievances. It also exposed limits: Hindu-Muslim unity was fragile, Dalit political assertion questioned Congress leadership, and workers' and peasants' demands were often subordinated to national unity. Repression repeatedly disrupted organisation.

The movement's success lay less in a single decisive action than in making colonial rule ungovernable at scale and legitimising the demand for independence. Its uneven social reach is part of the story, not an exception to it.`,
  },
  {
    id: 'mains-sci-01',
    subjectId: 'science-tech',
    question:
      'Biotechnology offers significant public-health benefits, but equitable access and effective regulation are essential. Examine with Indian examples.',
    marks: 15,
    guidance:
      'Discuss concrete applications, affordability and access barriers, regulatory architecture, and the balance between innovation incentives and public interest.',
    modelAnswer: `Biotechnology has transformed diagnostics, vaccines and therapeutics. Recombinant insulin, monoclonal antibodies, PCR-based diagnostics and mRNA platforms have improved health outcomes, and India's vaccine manufacturing capacity is globally significant.

Benefits do not automatically translate into access. Prices, intellectual property, cold-chain capacity and distribution determine who is reached. During the COVID-19 pandemic, manufacturing scale coexisted with inequitable global distribution, showing that capacity alone is insufficient. Technology transfer, voluntary licensing and public procurement can improve affordability.

Regulation must keep pace with the science. Institutional biosafety committees and the Review Committee on Genetic Manipulation oversee genetically engineered organisms, while the Drug Controller General of India regulates therapeutic products. Clinical trials require ethics approval and informed consent. Genome editing, gene therapy and AI-assisted diagnostics raise questions that existing categories only partly address.

A balanced approach combines predictable regulation, transparency of trial data, investment in public research and manufacturing, and equity-oriented procurement. Innovation incentives should be designed so that they do not become barriers to access.`,
  },
  {
    id: 'mains-eth-01',
    subjectId: 'ethics',
    question:
      'A senior officer discovers that a colleague has been approving contracts for a firm owned by a relative. The colleague has an excellent service record and is nearing retirement. Discuss the ethical issues and the course of action you would take.',
    marks: 15,
    guidance:
      'Identify values and stakeholders, the conflict between loyalty and integrity, the legal and institutional route, and safeguards against retaliation and harm to the investigation.',
    modelAnswer: `The case presents a conflict between personal loyalty and collegiality on one side, and integrity, impartiality and public trust on the other. Approving contracts for a relative's firm creates a conflict of interest, may violate conduct rules, and can amount to corruption. A good service record does not neutralise the current conduct.

Stakeholders include the public, the colleague, other staff, the firm's competitors, and the officer as a witness. Inaction would make the officer complicit and damage institutional credibility; a public confrontation could prejudice the investigation and unfairly harm reputations before facts are established.

The appropriate course is to verify the facts discreetly, document them, and report through the prescribed channel to the appropriate vigilance or disciplinary authority. The officer should avoid participating in any decision on the matter, maintain confidentiality, and cooperate fully. If immediate risk of further loss exists, a written interim escalation is justified.

Throughout, the officer should act with fairness to the colleague: the allegation is investigated, not prejudged, and the colleague has a right to respond. Integrity requires the report; fairness requires the process.`,
  },
];
