export type EducationLevel = "k12" | "university";

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

export const TOPICS = [...K12_TOPICS, ...UNIVERSITY_TOPICS] as const;

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
};

export function getTopicsForLevel(level: EducationLevel): Topic[] {
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
