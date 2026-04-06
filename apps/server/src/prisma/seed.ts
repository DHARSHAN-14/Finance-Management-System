import 'dotenv/config';
import { PrismaClient, UserRole, LoanStatus, ChitStatus, PaymentMethod, InstallmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateEMI, generateAmortizationSchedule } from '../utils/finance';
import { generateCustomerCode, generateUserCode } from '../utils/codes';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  const collections = [
    prisma.auditLog, prisma.notification, prisma.honestyScoreSnapshot,
    prisma.paymentAllocation, prisma.chitInstallmentPayment,
    prisma.chitInstallment, prisma.chitMember, prisma.chit,
    prisma.payment, prisma.loanInstallment, prisma.loan,
    prisma.refreshToken, prisma.user, prisma.customer,
    prisma.announcement, prisma.systemSetting,
  ];
  for (const col of collections) {
    await (col as any).deleteMany();
  }
  // Allow MongoDB indexes to settle
  await new Promise(r => setTimeout(r, 1000));

  const hashedAdmin = await bcrypt.hash('Admin@1234', 12);
  const hashedStaff = await bcrypt.hash('Staff@1234', 12);
  const hashedClient = await bcrypt.hash('Client@1234', 12);

  // Admin user
  const admin = await prisma.user.create({
    data: {
      userCode: generateUserCode('ADMIN'),
      name: 'SK Admin',
      email: 'admin@skassociates.com',
      password: hashedAdmin,
      role: UserRole.ADMIN,
      phone: '9876543210',
    },
  });

  // Staff user
  await prisma.user.create({
    data: {
      userCode: generateUserCode('STAFF'),
      name: 'Priya Staff',
      email: 'staff@skassociates.com',
      password: hashedStaff,
      role: UserRole.STAFF,
      phone: '9876543211',
    },
  });

  // Customers
  const customer1 = await prisma.customer.create({
    data: {
      customerCode: generateCustomerCode(),
      name: 'Rajan Kumar',
      email: 'rajan@example.com',
      phone: '9876500001',
      address: '12, Gandhi Street, Coimbatore',
      occupation: 'Businessman',
      monthlyIncome: 50000,
      aadhaarNo: '1234-5678-9001',
      panNo: 'ABCDE1234F',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerCode: generateCustomerCode(),
      name: 'Meena Devi',
      email: 'meena@example.com',
      phone: '9876500002',
      address: '45, Anna Nagar, Coimbatore',
      occupation: 'Teacher',
      monthlyIncome: 35000,
      aadhaarNo: '1234-5678-9002',
      panNo: 'FGHIJ5678K',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerCode: generateCustomerCode(),
      name: 'Suresh Babu',
      email: 'suresh@example.com',
      phone: '9876500003',
      address: '78, RS Puram, Coimbatore',
      occupation: 'Engineer',
      monthlyIncome: 60000,
      aadhaarNo: '1234-5678-9003',
      panNo: 'KLMNO9012L',
    },
  });

  // Client user linked to customer1
  await prisma.user.create({
    data: {
      userCode: generateUserCode('CLIENT'),
      name: customer1.name,
      email: 'client@skassociates.com',
      password: hashedClient,
      role: UserRole.CLIENT,
      phone: customer1.phone,
      customerId: customer1.id,
    },
  });

  // Create a loan for customer1
  const principal = 100000;
  const rate = 12; // 12% per annum
  const tenure = 12;
  const emi = calculateEMI(principal, rate, tenure);
  const startDate = new Date('2024-01-01');

  const loan = await prisma.loan.create({
    data: {
      customerId: customer1.id,
      loanNo: 'SKL-2024-001',
      principalAmount: principal,
      interestRate: rate,
      tenure,
      emi,
      processingFee: 1000,
      disbursedAmount: principal - 1000,
      status: LoanStatus.ACTIVE,
      purpose: 'Business expansion',
      startDate,
      endDate: new Date('2024-12-01'),
      approvedBy: admin.id,
      approvedAt: new Date('2023-12-28'),
      disbursedAt: new Date('2024-01-01'),
    },
  });

  // Generate installments
  const schedule = generateAmortizationSchedule(principal, rate, tenure, startDate);
  for (const inst of schedule) {
    await prisma.loanInstallment.create({
      data: {
        loanId: loan.id,
        installmentNo: inst.installmentNo,
        dueDate: inst.dueDate,
        principalAmount: inst.principal,
        interestAmount: inst.interest,
        totalAmount: inst.totalAmount,
        paidAmount: 0,
        status: InstallmentStatus.PENDING,
      },
    });
  }

  // Mark first 3 installments as paid
  const installments = await prisma.loanInstallment.findMany({
    where: { loanId: loan.id },
    orderBy: { installmentNo: 'asc' },
    take: 3,
  });

  let paymentCounter = 1;
  for (const inst of installments) {
    const payment = await prisma.payment.create({
      data: {
        customerId: customer1.id,
        paymentNo: `SKP-2024-${String(paymentCounter++).padStart(4, '0')}`,
        amount: inst.totalAmount,
        method: PaymentMethod.CASH,
        paymentDate: inst.dueDate,
        collectedBy: admin.id,
      },
    });

    await prisma.paymentAllocation.create({
      data: {
        paymentId: payment.id,
        loanId: loan.id,
        installmentId: inst.id,
        amount: inst.totalAmount,
      },
    });

    await prisma.loanInstallment.update({
      where: { id: inst.id },
      data: {
        paidAmount: inst.totalAmount,
        status: InstallmentStatus.PAID,
        paidDate: inst.dueDate,
      },
    });
  }

  // Create a chit fund
  const chit = await prisma.chit.create({
    data: {
      name: 'Gold Chit 2024 - 1L',
      totalValue: 100000,
      monthlyContribution: 10000,
      duration: 10,
      commissionPct: 5,
      status: ChitStatus.ACTIVE,
      startDate: new Date('2024-01-01'),
      description: 'Monthly chit fund - 10 members, 1 lakh',
    },
  });

  // Add members to chit
  const chitCustomers = [customer1, customer2, customer3];
  for (let i = 0; i < chitCustomers.length; i++) {
    await prisma.chitMember.create({
      data: {
        chitId: chit.id,
        customerId: chitCustomers[i].id,
        ticketNo: i + 1,
      },
    });
  }

  // Create chit installments
  for (let i = 1; i <= 10; i++) {
    const dueDate = new Date('2024-01-01');
    dueDate.setMonth(dueDate.getMonth() + i - 1);
    await prisma.chitInstallment.create({
      data: {
        chitId: chit.id,
        installmentNo: i,
        dueDate,
      },
    });
  }

  // Honesty score snapshots
  await prisma.honestyScoreSnapshot.create({
    data: {
      customerId: customer1.id,
      score: 86,
      category: 'Highly Trustworthy',
      onTimePayments: 3,
      latePayments: 0,
      missedPayments: 0,
      bonus: 0,
    },
  });

  // System settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'company_name', value: 'SK Associates' },
      { key: 'late_penalty_pct', value: '2' },
      { key: 'grace_period_days', value: '3' },
    ],
  });

  // Notifications
  await prisma.notification.create({
    data: {
      customerId: customer1.id,
      title: 'Payment Received',
      body: 'Your EMI payment of ₹8,884 for January 2024 has been received.',
      type: 'SUCCESS',
    },
  });

  console.log('Seed complete!');
  console.log('\nSample Credentials:');
  console.log('Admin: admin@skassociates.com / Admin@1234');
  console.log('Staff: staff@skassociates.com / Staff@1234');
  console.log('Client: client@skassociates.com / Client@1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
