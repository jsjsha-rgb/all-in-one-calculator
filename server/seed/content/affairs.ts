import type { SeedArticle } from '../types';

/**
 * SAMPLE current-affairs briefs.
 *
 * These are evergreen explainers written for the prototype, dated for the demo
 * feed and explicitly labelled as sample content. They are not live news and do
 * not quote or attribute claims to any real publisher. The source_url points to
 * a clearly non-publishing demo path so no real outlet is misrepresented.
 */
const demoSource = (slug: string) => `https://demo.studaymentor.app/sample-sources/${slug}`;

export const articles: SeedArticle[] = [
  {
    id: 'ca-30x30',
    title: 'Sample explainer: What the "30x30" biodiversity target means for India',
    summary:
      'A guide to the area-based conservation target in the Kunming-Montreal framework, how protected areas are counted, and why quality matters as much as acreage.',
    content: `The Kunming-Montreal Global Biodiversity Framework, adopted in 2022, includes a target to conserve at least 30 percent of terrestrial and inland water areas and 30 percent of coastal and marine areas by 2030. India already has a dense network of national parks, sanctuaries, conservation reserves and community reserves, but coverage is uneven across ecosystems.

Three issues deserve attention. First, area alone does not guarantee ecological outcomes: a small, well-managed and connected reserve may conserve more than a large paper park. Second, equity matters. Conservation areas overlap with the livelihoods of forest-dependent communities, so the recognition of rights and participatory management is part of effective conservation, not an afterthought. Third, marine protection in India lags terrestrial protection, and coastal habitats such as mangroves and seagrass meadows need specific measures.

A balanced answer treats 30x30 as a floor rather than a finish line, and connects it with restoration, connectivity and community institutions.`,
    subjectId: 'environment',
    sourceUrl: demoSource('30x30-biodiversity'),
    sourceLabel: 'StudyMentor sample newsroom (demo content, not live news)',
    publishedAt: '2026-10-18',
    prelimsFacts: [
      'The framework was adopted under the Convention on Biological Diversity in 2022.',
      'India has four global biodiversity hotspots: Himalaya, Indo-Burma, Western Ghats-Sri Lanka and Sundaland.',
      'Conservation reserves and community reserves were added to the Wild Life (Protection) Act by the 2003 amendment.',
    ],
    mainsRelevance:
      'Useful for GS III questions on biodiversity conservation, protected-area governance and the balance between ecological targets and community rights.',
    relatedTopic: 'Biodiversity',
  },
  {
    id: 'ca-inflation-band',
    title: 'Sample explainer: Reading the RBI\u2019s inflation band',
    summary:
      'How flexible inflation targeting works, what the 2-6 percent band means, and why food prices complicate the picture.',
    content: `India\u2019s Monetary Policy Committee targets consumer price inflation of 4 percent, with a tolerance band of 2 to 6 percent. The framework, adopted in 2016, requires the RBI to explain deviations and to report to the government if inflation stays outside the band for three consecutive quarters.

The band is not a target range within which policy is passive. The MPC responds to the projected path of inflation, output and the exchange rate. When inflation is driven by food supply shocks, monetary tightening may have limited short-run effect on prices while imposing costs on investment. That is why the composition of inflation matters: core inflation signals demand pressure, while volatile food prices signal supply constraints.

A good answer distinguishes the instrument from the target, explains transmission lags, and notes that fiscal and supply-side measures complement monetary policy. It also avoids claiming that the RBI controls all prices; it influences aggregate demand and expectations.`,
    subjectId: 'economy',
    sourceUrl: demoSource('inflation-band'),
    sourceLabel: 'StudyMentor sample newsroom (demo content, not live news)',
    publishedAt: '2026-10-16',
    prelimsFacts: [
      'Inflation target: 4 percent, with a tolerance band of 2-6 percent.',
      'The target is measured using the Consumer Price Index.',
      'The MPC has six members and meets at least four times a year.',
    ],
    mainsRelevance:
      'Applies to GS III questions on monetary policy, inflation management and the limits of demand-side tools during supply shocks.',
    relatedTopic: 'Monetary Policy',
  },
  {
    id: 'ca-basic-structure',
    title: 'Sample explainer: The basic structure doctrine, explained without jargon',
    summary:
      'What the doctrine protects, how courts have used it, and the debate over an open-ended list of constitutional features.',
    content: `The basic structure doctrine holds that Parliament can amend the Constitution but cannot destroy its essential features. It emerged in Kesavananda Bharati (1973), was applied in Indira Nehru Gandhi (1975), and was reinforced in Minerva Mills (1980).

The list of protected features is not closed. Courts have identified judicial review, free and fair elections, federalism, secularism, the separation of powers and equality among the features that cannot be erased. Critics argue that an open list gives judges wide discretion. Defenders reply that the doctrine is a response to the risk of constitutional self-destruction, and that courts must still show a clear violation.

For exam purposes, distinguish three things: the text of the Constitution, the amending power under Article 368, and the judge-made limitation on that power. The doctrine is not mentioned in the constitutional text, which is precisely why its legitimacy is debated.`,
    subjectId: 'polity',
    sourceUrl: demoSource('basic-structure'),
    sourceLabel: 'StudyMentor sample newsroom (demo content, not live news)',
    publishedAt: '2026-10-14',
    prelimsFacts: [
      'Kesavananda Bharati v. State of Kerala was decided in 1973.',
      'The doctrine limits the amending power under Article 368.',
      'Minerva Mills (1980) applied the doctrine to strike down parts of the 42nd Amendment.',
    ],
    mainsRelevance:
      'Useful for GS II questions on constitutional interpretation, judicial review and the balance between parliamentary sovereignty and constitutional supremacy.',
    relatedTopic: 'Judiciary',
  },
  {
    id: 'ca-monsoon-rabi',
    title: 'Sample explainer: Monsoon withdrawal and rabi planning',
    summary:
      'Why the timing of monsoon withdrawal matters for soil moisture, reservoir storage and the rabi crop.',
    content: `Monsoon withdrawal typically begins from north-west India in September and progresses southwards. The timing matters because late-season rainfall can recharge soil moisture and reservoirs before rabi sowing, while an early withdrawal can leave deficits that affect wheat, mustard and gram.

Farmers make sowing decisions using rainfall, soil moisture, irrigation availability and price expectations. Policy supports include minimum support prices, crop insurance and advisories. Reservoir storage is a key buffer; when storage is low, irrigation releases compete with drinking water and hydropower.

For an exam answer, connect the physical process (withdrawal, anticyclonic conditions) with the agricultural calendar and the policy response. Avoid treating a single dry spell as proof of a drought; drought is assessed over a season and in relation to local norms.`,
    subjectId: 'geography',
    sourceUrl: demoSource('monsoon-rabi'),
    sourceLabel: 'StudyMentor sample newsroom (demo content, not live news)',
    publishedAt: '2026-10-12',
    prelimsFacts: [
      'Monsoon withdrawal usually begins in north-west India in September.',
      'Rabi crops are sown in October-December and harvested in spring.',
      'Reservoir storage is monitored by the Central Water Commission.',
    ],
    mainsRelevance:
      'Links to GS I geography and GS III agriculture questions on monsoon variability, irrigation and rural livelihoods.',
    relatedTopic: 'Agriculture',
  },
  {
    id: 'ca-gene-editing',
    title: 'Sample explainer: Gene editing and the regulation question',
    summary:
      'What CRISPR-Cas9 does, why off-target effects matter, and how regulation tries to keep pace with the science.',
    content: `CRISPR-Cas9 uses a guide RNA to direct the Cas9 enzyme to a target DNA sequence, where it makes a cut. The cell then repairs the break, sometimes disabling a gene and sometimes inserting new sequence. The technique is powerful because it is precise, cheap and adaptable.

Precision is not perfection. Off-target edits, unintended rearrangements and heritability are central concerns, especially for germline applications. Somatic gene therapies, which affect only the patient, raise different ethical questions from germline editing, which can be inherited.

In India, genetically engineered organisms are regulated through institutional biosafety committees and the Review Committee on Genetic Manipulation, with the Drug Controller General of India regulating therapeutic products. Regulation must balance innovation with safety, transparency and public trust. A strong answer names the technology accurately and separates scientific uncertainty from ethical disagreement.`,
    subjectId: 'science-tech',
    sourceUrl: demoSource('gene-editing'),
    sourceLabel: 'StudyMentor sample newsroom (demo content, not live news)',
    publishedAt: '2026-10-10',
    prelimsFacts: [
      'CRISPR-Cas9 is a gene-editing tool derived from a bacterial immune mechanism.',
      'Somatic edits affect the patient; germline edits can be inherited.',
      'The Review Committee on Genetic Manipulation oversees genetically engineered organisms in India.',
    ],
    mainsRelevance:
      'Relevant to GS III science and technology questions on biotechnology governance, ethics and regulatory capacity.',
    relatedTopic: 'Biotechnology',
  },
  {
    id: 'ca-loss-damage',
    title: 'Sample explainer: Loss and damage finance in climate negotiations',
    summary:
      'The difference between mitigation, adaptation and loss and damage, and why finance is the hard part.',
    content: `Climate policy has three broad buckets. Mitigation reduces greenhouse gas emissions. Adaptation helps societies cope with unavoidable impacts. Loss and damage addresses impacts that cannot be avoided or adapted to, such as irreversible cultural or ecosystem loss.

At the UNFCCC negotiations, developing countries have argued that historical responsibility and capacity should shape who pays. A loss and damage fund was operationalised after COP27, but questions remain about scale, eligibility, access and whether contributions are additional to existing aid.

An exam answer should distinguish the concepts clearly and avoid conflating finance pledges with disbursed resources. It should also recognise that adaptation and social protection are complements, not substitutes, for emissions reduction.`,
    subjectId: 'environment',
    sourceUrl: demoSource('loss-and-damage'),
    sourceLabel: 'StudyMentor sample newsroom (demo content, not live news)',
    publishedAt: '2026-10-08',
    prelimsFacts: [
      'The UNFCCC was adopted at the 1992 Rio Earth Summit.',
      'The loss and damage fund was operationalised following COP27.',
      'Common but differentiated responsibilities is a founding UNFCCC principle.',
    ],
    mainsRelevance:
      'Useful for GS III climate governance questions on equity, climate finance and international negotiations.',
    relatedTopic: 'Climate Governance',
  },
  {
    id: 'ca-ashoka',
    title: 'Sample explainer: Reading Ashokan edicts as governance texts',
    summary:
      'Why the edicts are more than religious inscriptions, and what they reveal about public communication.',
    content: `Ashokan edicts are usually studied for their message of dhamma, but they are also evidence of how an ancient state communicated with its people. The inscriptions were placed at public sites, at crossroads and near trade routes, and they address officials as well as subjects.

The edicts describe dhamma-mahamattas, officers concerned with welfare and public ethics. They instruct officials to be accessible and impartial, and they report welfare measures such as wells, rest houses and medical support. This does not mean the Mauryan state was a modern welfare state; it does mean that governance, ethics and public communication were connected in official self-representation.

For an answer, treat inscriptions as one source among several, alongside the Arthashastra, Megasthenes and archaeology. Each has its own purpose and bias, and the strongest answers compare rather than rely on a single text.`,
    subjectId: 'history',
    sourceUrl: demoSource('ashokan-edicts'),
    sourceLabel: 'StudyMentor sample newsroom (demo content, not live news)',
    publishedAt: '2026-10-05',
    prelimsFacts: [
      'Ashokan inscriptions were deciphered by James Prinsep in the 1830s.',
      'Edicts were composed in several languages and scripts.',
      'Dhamma-mahamattas were officers associated with public ethics and welfare.',
    ],
    mainsRelevance:
      'Connects to GS I ancient history questions on sources, administration and the Mauryan state.',
    relatedTopic: 'Ancient India',
  },
  {
    id: 'ca-relief-ethics',
    title: 'Sample case study: Ethical distribution of disaster relief',
    summary:
      'A short case on queues, verification and vulnerable groups, with a reasoning framework for GS IV.',
    content: `A cyclone has damaged three villages. Relief material has arrived, but the list of affected households is incomplete and rumours are spreading. A local official must decide whether to distribute relief immediately on the basis of visible need, wait for verification, or use a hybrid approach.

The immediate priority is to prevent avoidable harm: water, food, shelter and medical care. At the same time, the process must be transparent and fair, and it must reach people who are less able to queue, such as the elderly, persons with disabilities and single caregivers. A hybrid approach can combine immediate provisional relief with a rapid verification process and an appeal mechanism.

The ethical reasoning should name the values in tension (urgency, fairness, accountability), identify stakeholders and harms, and explain safeguards. A good answer does not pretend that a single rule solves the case; it shows how process design protects both lives and trust.`,
    subjectId: 'ethics',
    sourceUrl: demoSource('relief-ethics'),
    sourceLabel: 'StudyMentor sample newsroom (demo content, not live news)',
    publishedAt: '2026-10-02',
    prelimsFacts: [
      'Disaster management in India is guided by the Disaster Management Act, 2005.',
      'The National Disaster Management Authority is chaired by the Prime Minister.',
      'Ethics case studies reward reasoned trade-offs, not slogans.',
    ],
    mainsRelevance:
      'Directly usable as a GS IV case-study practice prompt on distributive justice, empathy and administrative accountability.',
    relatedTopic: 'Case Studies',
  },
];
