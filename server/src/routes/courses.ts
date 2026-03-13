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
