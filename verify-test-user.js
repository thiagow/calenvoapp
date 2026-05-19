const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyTestUser() {
  try {
    console.log('🔍 Procurando usuário de teste...\n');

    // Buscar usuário john@doe.com
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'john@doe.com'
      }
    });

    if (!testUser) {
      console.log('❌ Usuário john@doe.com NÃO foi encontrado no banco!');
      console.log('📝 Execute: npx prisma db seed');
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log('   Email:', testUser.email);
    console.log('   Nome:', testUser.name);
    console.log('   Role:', testUser.role);
    console.log('   Status:', testUser.isActive ? 'ATIVO' : 'INATIVO');
    console.log('   Plano:', testUser.planType);
    console.log('   Hash da senha (primeiros 20 chars):', testUser.password?.substring(0, 20) + '...');

    // Testar se a senha 'johndoe123' é válida
    console.log('\n🔐 Testando senha "johndoe123"...');
    const isValidPassword = await bcrypt.compare('johndoe123', testUser.password);

    if (isValidPassword) {
      console.log('✅ Senha CORRETA!');
      console.log('\n📋 Credenciais de teste:');
      console.log('   Email: john@doe.com');
      console.log('   Senha: johndoe123');
    } else {
      console.log('❌ Senha INVÁLIDA!');
      console.log('⚠️ O usuário existe mas a senha está incorreta.');
      console.log('💡 Solução: Regenerar a senha via script update-passwords.ts');
    }

    // Verificar outros usuários
    console.log('\n📊 Outros usuários no banco:');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (allUsers.length === 0) {
      console.log('   (nenhum usuário encontrado)');
    } else {
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name}) [${user.role}] ${user.isActive ? '✅' : '❌'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTestUser();
