const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetTestPassword() {
  try {
    const email = 'john@doe.com';
    const role = 'MASTER';
    const newPassword = 'johndoe123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    console.log('🔄 Redefinindo senha para john@doe.com...\n');

    const user = await prisma.user.update({
      where: { 
        email_role: {
          email: email,
          role: role
        }
      },
      data: { password: hashedPassword },
      select: { email: true, name: true, role: true }
    });

    console.log('✅ Senha redefinida com sucesso!');
    console.log('\n📋 Credenciais de teste:');
    console.log('   Email: john@doe.com');
    console.log('   Senha: johndoe123');
    console.log('   Nome: ' + user.name);
    console.log('   Role: ' + user.role);
    console.log('\n💡 Agora você pode fazer login com essas credenciais!');

  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestPassword();
