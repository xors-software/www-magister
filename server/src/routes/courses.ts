import { Elysia, t } from "elysia";
import {
	addMaterial,
	createCourse,
	deleteCourse,
	deleteMaterial,
	getAllCourses,
	getCourseWithMaterials,
	updateCourse,
	updateMaterial,
} from "../lib/courses";

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
	const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
	const result = await pdfParse(buffer);
	return result.text;
}

async function extractTextFromFile(file: File): Promise<string> {
	const name = file.name.toLowerCase();

	if (name.endsWith(".pdf")) {
		const buffer = Buffer.from(await file.arrayBuffer());
		return await extractTextFromPdf(buffer);
	}

	return await file.text();
}

export const coursesRoutes = new Elysia({ prefix: "/courses" })
	.post(
		"/",
		({ body }) => {
			const course = createCourse(body.name, body.description || "");
			return course;
		},
		{
			body: t.Object({
				name: t.String({ minLength: 1 }),
				description: t.Optional(t.String()),
			}),
		},
	)
	.get("/", () => {
		return getAllCourses();
	})
	.get(
		"/:id",
		({ params: { id }, set }) => {
			const result = getCourseWithMaterials(id);
			if (!result) {
				set.status = 404;
				return { error: "Course not found" };
			}
			return result;
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.put(
		"/:id",
		({ params: { id }, body, set }) => {
			const course = updateCourse(id, body);
			if (!course) {
				set.status = 404;
				return { error: "Course not found" };
			}
			return course;
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				name: t.Optional(t.String({ minLength: 1 })),
				description: t.Optional(t.String()),
			}),
		},
	)
	.delete(
		"/:id",
		({ params: { id }, set }) => {
			if (!deleteCourse(id)) {
				set.status = 404;
				return { error: "Course not found" };
			}
			return { deleted: true };
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.post(
		"/:id/materials",
		({ params: { id }, body, set }) => {
			const material = addMaterial(id, body.title, body.content);
			if (!material) {
				set.status = 404;
				return { error: "Course not found" };
			}
			return material;
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				title: t.String({ minLength: 1 }),
				content: t.String({ minLength: 1 }),
			}),
		},
	)
	.post(
		"/:id/materials/upload",
		async ({ params: { id }, body, set }) => {
			const file = body.file;
			if (!file) {
				set.status = 400;
				return { error: "No file provided" };
			}

			try {
				const content = await extractTextFromFile(file);
				if (!content.trim()) {
					set.status = 400;
					return { error: "Could not extract text from file. The file may be empty or contain only images." };
				}

				const title = body.title || file.name.replace(/\.[^.]+$/, "");
				const material = addMaterial(id, title, content.trim());
				if (!material) {
					set.status = 404;
					return { error: "Course not found" };
				}
				return material;
			} catch (err) {
				set.status = 400;
				return { error: `Failed to process file: ${err instanceof Error ? err.message : "unknown error"}` };
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				file: t.File(),
				title: t.Optional(t.String()),
			}),
		},
	)
	.put(
		"/materials/:materialId",
		({ params: { materialId }, body, set }) => {
			const material = updateMaterial(materialId, body);
			if (!material) {
				set.status = 404;
				return { error: "Material not found" };
			}
			return material;
		},
		{
			params: t.Object({ materialId: t.String() }),
			body: t.Object({
				title: t.Optional(t.String({ minLength: 1 })),
				content: t.Optional(t.String({ minLength: 1 })),
			}),
		},
	)
	.delete(
		"/materials/:materialId",
		({ params: { materialId }, set }) => {
			if (!deleteMaterial(materialId)) {
				set.status = 404;
				return { error: "Material not found" };
			}
			return { deleted: true };
		},
		{ params: t.Object({ materialId: t.String() }) },
	);
