require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Child = require('../models/Child');
const Class = require('../models/Class');
const connectDB = require('../config/database');
const logger = require('./logger');

const seed = async () => {
  await connectDB();
  logger.info('Starting database seed...');

  await Promise.all([
    User.deleteMany({}),
    Branch.deleteMany({}),
    Teacher.deleteMany({}),
    Parent.deleteMany({}),
    Child.deleteMany({}),
    Class.deleteMany({}),
  ]);
  logger.info('Cleared existing data');

  const hqBranch = await Branch.create({
    name: 'Koramangala Branch',
    code: 'LM-KOR',
    address: { street: '5th Block, Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560095' },
    contact: { phone: '080-12345678', email: 'koramangala@littlemillennium.com' },
    capacity: 300,
    isHeadquarters: true,
    timings: { openTime: '08:00', closeTime: '14:00' },
  });

  const branch2 = await Branch.create({
    name: 'Indiranagar Branch',
    code: 'LM-IND',
    address: { street: '100 Feet Road', city: 'Bangalore', state: 'Karnataka', pincode: '560038' },
    contact: { phone: '080-23456789', email: 'indiranagar@littlemillennium.com' },
    capacity: 250,
  });

  logger.info('Created branches');

  const superAdmin = await User.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@littlemillennium.com',
    password: 'Admin@123456',
    role: 'super-admin',
    branch: hqBranch._id,
    phone: '9999999999',
  });

  const branchAdmin = await User.create({
    firstName: 'Branch',
    lastName: 'Admin',
    email: 'branch@littlemillennium.com',
    password: 'Branch@123',
    role: 'branch-admin',
    branch: hqBranch._id,
    phone: '9999999998',
  });

  const teacherUser = await User.create({
    firstName: 'Priya',
    lastName: 'Verma',
    email: 'teacher@littlemillennium.com',
    password: 'Teacher@123',
    role: 'teacher',
    branch: hqBranch._id,
    phone: '9999999997',
  });

  const parentUser = await User.create({
    firstName: 'Rajesh',
    lastName: 'Sharma',
    email: 'parent@littlemillennium.com',
    password: 'Parent@123',
    role: 'parent',
    branch: hqBranch._id,
    phone: '9999999996',
  });

  logger.info('Created users');

  const teacher = await Teacher.create({
    user: teacherUser._id,
    branch: hqBranch._id,
    employeeId: 'EMP-001',
    designation: 'Head Teacher',
    qualifications: [{ degree: 'B.Ed', institution: 'Delhi University', year: 2016 }],
    experience: { years: 8 },
    subjects: ['Language', 'Arts', 'Music'],
    isActive: true,
  });

  const classes = await Class.insertMany([
    { name: 'Pre-Nursery A', grade: 'Pre-Nursery', section: 'A', branch: hqBranch._id, classTeacher: teacher._id, capacity: 15, academicYear: '2024-2025', fees: { tuitionFee: 8000, activityFee: 1000 } },
    { name: 'Nursery A', grade: 'Nursery', section: 'A', branch: hqBranch._id, classTeacher: teacher._id, capacity: 18, academicYear: '2024-2025', fees: { tuitionFee: 10000, activityFee: 1500 } },
    { name: 'LKG A', grade: 'LKG', section: 'A', branch: hqBranch._id, classTeacher: teacher._id, capacity: 20, academicYear: '2024-2025', fees: { tuitionFee: 12000, activityFee: 2000 } },
    { name: 'UKG A', grade: 'UKG', section: 'A', branch: hqBranch._id, classTeacher: teacher._id, capacity: 20, academicYear: '2024-2025', fees: { tuitionFee: 14000, activityFee: 2000 } },
  ]);

  const lkgClass = classes.find(c => c.grade === 'LKG');

  const child = await Child.create({
    admissionNumber: 'LM2024001',
    firstName: 'Aarav',
    lastName: 'Sharma',
    dateOfBirth: new Date('2019-03-15'),
    gender: 'Male',
    branch: hqBranch._id,
    class: lkgClass._id,
    grade: 'LKG',
    section: 'A',
    academicYear: '2024-2025',
    status: 'active',
    parents: [{
      user: parentUser._id,
      relation: 'Father',
      isPrimary: true,
      name: 'Rajesh Sharma',
      phone: '9999999996',
      email: 'parent@littlemillennium.com',
    }],
    medical: { bloodGroup: 'B+', allergies: ['Peanuts'] },
    developmentProfile: { cognitive: 75, motor: 80, emotional: 70, language: 85, social: 78 },
  });

  await Parent.create({
    user: parentUser._id,
    branch: hqBranch._id,
    children: [child._id],
  });

  logger.info('✅ Seed completed successfully!');
  logger.info('Demo accounts:');
  logger.info('  Super Admin: admin@littlemillennium.com / Admin@123456');
  logger.info('  Branch Admin: branch@littlemillennium.com / Branch@123');
  logger.info('  Teacher: teacher@littlemillennium.com / Teacher@123');
  logger.info('  Parent: parent@littlemillennium.com / Parent@123');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(err => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
