import prisma from '../utils/prisma';

export async function createStudent(teacherId: string, data: {
  name: string;
  phone?: string;
  grade?: string;
  school?: string;
  parents?: { name: string; phone: string; relationship: string }[];
}) {
  const { parents, ...studentData } = data;

  const student = await prisma.student.create({
    data: {
      ...studentData,
      teacherId,
      parents: parents && parents.length > 0
        ? { create: parents }
        : undefined,
    },
    include: { parents: true },
  });

  return student;
}

export async function updateStudent(studentId: string, teacherId: string, data: Record<string, any>) {
  const student = await prisma.student.findFirst({ where: { id: studentId, teacherId } });
  if (!student) {
    throw Object.assign(new Error('학생을 찾을 수 없습니다.'), { status: 404 });
  }

  return prisma.student.update({
    where: { id: studentId },
    data,
    include: { parents: true },
  });
}

export async function deleteStudent(studentId: string, teacherId: string) {
  const student = await prisma.student.findFirst({ where: { id: studentId, teacherId } });
  if (!student) {
    throw Object.assign(new Error('학생을 찾을 수 없습니다.'), { status: 404 });
  }

  await prisma.student.delete({ where: { id: studentId } });
}

export async function addParent(studentId: string, teacherId: string, data: {
  name: string;
  phone: string;
  relationship: string;
}) {
  const student = await prisma.student.findFirst({ where: { id: studentId, teacherId } });
  if (!student) {
    throw Object.assign(new Error('학생을 찾을 수 없습니다.'), { status: 404 });
  }

  return prisma.parent.create({
    data: { ...data, studentId },
  });
}

export async function deleteParent(parentId: string, teacherId: string) {
  const parent = await prisma.parent.findFirst({
    where: { id: parentId },
    include: { student: true },
  });

  if (!parent || parent.student.teacherId !== teacherId) {
    throw Object.assign(new Error('학부모 정보를 찾을 수 없습니다.'), { status: 404 });
  }

  await prisma.parent.delete({ where: { id: parentId } });
}
