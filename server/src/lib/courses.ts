import db from "./db";

export interface Course {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
}

export interface CourseMaterial {
	id: string;
	courseId: string;
	title: string;
	content: string;
	createdAt: string;
}

function generateId(prefix: string): string {
	return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function rowToCourse(row: Record<string, unknown>): Course {
	return {
		id: row.id as string,
		name: row.name as string,
		description: row.description as string,
		createdAt: row.created_at as string,
		updatedAt: row.updated_at as string,
	};
}

function rowToMaterial(row: Record<string, unknown>): CourseMaterial {
	return {
		id: row.id as string,
		courseId: row.course_id as string,
		title: row.title as string,
		content: row.content as string,
		createdAt: row.created_at as string,
	};
}

export function createCourse(name: string, description: string): Course {
	const id = generateId("crs");
	const now = new Date().toISOString();
	db.query(
		"INSERT INTO courses (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
	).run(id, name, description, now, now);
	return { id, name, description, createdAt: now, updatedAt: now };
}

export function getCourse(id: string): Course | null {
	const row = db.query("SELECT * FROM courses WHERE id = ?").get(id) as Record<string, unknown> | null;
	return row ? rowToCourse(row) : null;
}

export function getAllCourses(): Course[] {
	const rows = db.query("SELECT * FROM courses ORDER BY created_at DESC").all() as Record<string, unknown>[];
	return rows.map(rowToCourse);
}

export function updateCourse(id: string, updates: { name?: string; description?: string }): Course | null {
	const course = getCourse(id);
	if (!course) return null;

	const name = updates.name ?? course.name;
	const description = updates.description ?? course.description;
	const now = new Date().toISOString();

	db.query(
		"UPDATE courses SET name = ?, description = ?, updated_at = ? WHERE id = ?",
	).run(name, description, now, id);
	return { ...course, name, description, updatedAt: now };
}

export function deleteCourse(id: string): boolean {
	const result = db.query("DELETE FROM courses WHERE id = ?").run(id);
	return result.changes > 0;
}

export function addMaterial(courseId: string, title: string, content: string): CourseMaterial | null {
	if (!getCourse(courseId)) return null;
	const id = generateId("mat");
	const now = new Date().toISOString();
	db.query(
		"INSERT INTO course_materials (id, course_id, title, content, created_at) VALUES (?, ?, ?, ?, ?)",
	).run(id, courseId, title, content, now);
	return { id, courseId, title, content, createdAt: now };
}

export function getMaterials(courseId: string): CourseMaterial[] {
	const rows = db.query(
		"SELECT * FROM course_materials WHERE course_id = ? ORDER BY created_at ASC",
	).all(courseId) as Record<string, unknown>[];
	return rows.map(rowToMaterial);
}

export function getMaterial(id: string): CourseMaterial | null {
	const row = db.query("SELECT * FROM course_materials WHERE id = ?").get(id) as Record<string, unknown> | null;
	return row ? rowToMaterial(row) : null;
}

export function updateMaterial(id: string, updates: { title?: string; content?: string }): CourseMaterial | null {
	const material = getMaterial(id);
	if (!material) return null;

	const title = updates.title ?? material.title;
	const content = updates.content ?? material.content;

	db.query("UPDATE course_materials SET title = ?, content = ? WHERE id = ?").run(title, content, id);
	return { ...material, title, content };
}

export function deleteMaterial(id: string): boolean {
	const result = db.query("DELETE FROM course_materials WHERE id = ?").run(id);
	return result.changes > 0;
}

export function getCourseWithMaterials(courseId: string): { course: Course; materials: CourseMaterial[] } | null {
	const course = getCourse(courseId);
	if (!course) return null;
	const materials = getMaterials(courseId);
	return { course, materials };
}
