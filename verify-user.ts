import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.updateMany({
        where: { email: 'thiagow.net@gmail.com' },
        data: { password: '$2a$10$PSM93xpnPsyGVXEwtsmip.zMmrr5yETPPNzCdp.Doul56leSWd3/1S' }
    })
    console.dir(user, { depth: null })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
