export interface Problem {
	id: string;
	topic: string;
	subtopic: string;
	gradeLevel: number;
	question: string;
	correctAnswer: string;
	solutionSteps: string[];
	commonMisconceptions: string[];
	prerequisites: string[];
	difficulty: "foundational" | "on-grade" | "stretch";
}

export const TOPICS = [
	"linear-equations",
	"fractions-decimals",
	"proportional-reasoning",
	"expressions",
	"geometry",
] as const;

export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABELS: Record<Topic, string> = {
	"linear-equations": "Linear Equations",
	"fractions-decimals": "Fractions & Decimals",
	"proportional-reasoning": "Proportional Reasoning",
	expressions: "Expressions & Variables",
	geometry: "Geometry",
};

const PROBLEM_BANK: Problem[] = [
	// ── Linear Equations ──
	{
		id: "le-1",
		topic: "linear-equations",
		subtopic: "one-step",
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

export function getAllTopics(): { id: Topic; label: string; count: number }[] {
	return TOPICS.map((t) => ({
		id: t,
		label: TOPIC_LABELS[t],
		count: getProblemsForTopic(t).length,
	}));
}
