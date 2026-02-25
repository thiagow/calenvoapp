"use strict";(()=>{var e={};e.id=2757,e.ids=[2757,9487],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},61282:e=>{e.exports=require("child_process")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},21764:e=>{e.exports=require("util")},55598:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>R,patchFetch:()=>P,requestAsyncStorage:()=>C,routeModule:()=>A,serverHooks:()=>k,staticGenerationAsyncStorage:()=>E});var a={};o.r(a),o.d(a,{POST:()=>y,dynamic:()=>h});var r=o(49303),s=o(88716),n=o(60670),i=o(87070),l=o(71615),d=o(69206),c=o(9487),p=o(42023),u=o.n(p);async function f(e){try{let t=await fetch("https://apps.abacus.ai/api/sendNotificationEmail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,subject:`✅ Bem-vindo ao Calenvo ${e.planName}!`,body:`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo ao Calenvo!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                    ✅ Pagamento Confirmado!
                  </h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin-top: 0; font-size: 24px;">
                    Ol\xe1, ${e.name}! 🎉
                  </h2>
                  
                  <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                    Seja bem-vindo(a) ao <strong style="color: #667eea;">Calenvo</strong>! Seu pagamento foi confirmado com sucesso e sua conta j\xe1 est\xe1 ativa.
                  </p>
                  
                  <!-- Plan Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9ff; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
                    <tr>
                      <td style="padding: 25px;">
                        <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">
                          📋 Detalhes da Assinatura
                        </h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #666666; font-size: 14px;"><strong>Plano:</strong></td>
                            <td style="color: #333333; font-size: 14px; text-align: right;">${e.planName}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;"><strong>Valor:</strong></td>
                            <td style="color: #333333; font-size: 14px; text-align: right;">${e.planPrice}/m\xeas</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;"><strong>Email:</strong></td>
                            <td style="color: #333333; font-size: 14px; text-align: right;">${e.email}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;"><strong>Agendamentos:</strong></td>
                            <td style="color: #333333; font-size: 14px; text-align: right;">180/m\xeas</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;"><strong>Usu\xe1rios:</strong></td>
                            <td style="color: #333333; font-size: 14px; text-align: right;">At\xe9 3 usu\xe1rios</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Next Steps -->
                  <h3 style="color: #333333; font-size: 20px; margin: 30px 0 15px 0;">
                    🎯 Pr\xf3ximos Passos
                  </h3>
                  
                  <ol style="color: #666666; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                    <li>Acesse: <a href="https://calenvo-prod-thiago.netlify.app/login" style="color: #667eea; text-decoration: none; font-weight: bold;">calenvo.app/login</a></li>
                    <li>Fa\xe7a login com: <strong>${e.email}</strong></li>
                    <li>Configure os hor\xe1rios de atendimento</li>
                    <li>Adicione seus servi\xe7os</li>
                    <li>Comece a agendar! 🚀</li>
                  </ol>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="https://calenvo-prod-thiago.netlify.app/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                          Acessar Minha Conta
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Support -->
                  <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                    Precisa de ajuda? Responda este email ou entre em contato com nosso suporte em <a href="mailto:contato@calenvo.com.br" style="color: #667eea; text-decoration: none;">contato@calenvo.com.br</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9ff; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    Este \xe9 um email autom\xe1tico. Por favor, n\xe3o responda.<br>
                    &copy; ${new Date().getFullYear()} Calenvo. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,is_html:!0,recipient_email:e.email,sender_email:`noreply@${new URL("https://calenvo-prod-thiago.netlify.app").hostname}`,sender_alias:"Calenvo"})}),o=await t.json();if(!o.success)return console.error("❌ Erro ao enviar email de boas-vindas:",o.message),!1;return console.log("✅ Email de boas-vindas enviado para:",e.email),!0}catch(e){return console.error("❌ Erro ao enviar email de boas-vindas:",e),!1}}async function m(e){try{let t=await fetch("https://apps.abacus.ai/api/sendNotificationEmail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,subject:`⚠️ Problema com seu Pagamento - Calenvo`,body:`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Problema com Pagamento - Calenvo</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                    ⚠️ Problema com Pagamento
                  </h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin-top: 0; font-size: 24px;">
                    Ol\xe1, ${e.name}
                  </h2>
                  
                  <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                    Infelizmente, houve um problema ao processar seu pagamento para o Calenvo.
                  </p>
                  
                  <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                    <strong>Poss\xedveis causas:</strong>
                  </p>
                  
                  <ul style="color: #666666; font-size: 16px; line-height: 1.8;">
                    <li>Cart\xe3o sem saldo</li>
                    <li>Dados do cart\xe3o incorretos</li>
                    <li>Cart\xe3o vencido ou bloqueado</li>
                    <li>Limite de compras excedido</li>
                  </ul>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="https://calenvo-prod-thiago.netlify.app/signup/standard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                          Tentar Novamente
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                    Se o problema persistir, entre em contato com seu banco ou com nosso suporte.
                  </p>
                  
                  <!-- Support -->
                  <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                    Precisa de ajuda? Entre em contato: <a href="mailto:contato@calenvo.com.br" style="color: #667eea; text-decoration: none;">contato@calenvo.com.br</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9ff; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    Este \xe9 um email autom\xe1tico. Por favor, n\xe3o responda.<br>
                    &copy; ${new Date().getFullYear()} Calenvo. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,is_html:!0,recipient_email:e.email,sender_email:`noreply@${new URL("https://calenvo-prod-thiago.netlify.app").hostname}`,sender_alias:"Calenvo"})}),o=await t.json();if(!o.success)return console.error("❌ Erro ao enviar email de falha no pagamento:",o.message),!1;return console.log("✅ Email de falha no pagamento enviado para:",e.email),!0}catch(e){return console.error("❌ Erro ao enviar email de falha no pagamento:",e),!1}}var g=o(87396);let h="force-dynamic";async function y(e){let t;let o=await e.text(),a=(await (0,l.headers)()).get("stripe-signature");if(!a)return console.error("❌ Assinatura do webhook ausente"),i.NextResponse.json({error:"No signature"},{status:400});try{t=d.A.webhooks.constructEvent(o,a,process.env.STRIPE_WEBHOOK_SECRET)}catch(e){return console.error("❌ Erro ao validar webhook:",e.message),i.NextResponse.json({error:`Webhook Error: ${e.message}`},{status:400})}console.log(`🔔 Webhook recebido: ${t.type}`);try{switch(t.type){case"checkout.session.completed":await b(t.data.object);break;case"customer.subscription.created":console.log("✅ Assinatura criada:",t.data.object.id);break;case"customer.subscription.updated":await x(t.data.object);break;case"customer.subscription.deleted":await w(t.data.object);break;case"invoice.payment_succeeded":console.log("✅ Pagamento de fatura bem-sucedido:",t.data.object.id);break;case"invoice.payment_failed":await v(t.data.object);break;default:console.log(`ℹ️ Evento n\xe3o tratado: ${t.type}`)}return i.NextResponse.json({received:!0})}catch(e){return console.error(`❌ Erro ao processar webhook ${t.type}:`,e),i.NextResponse.json({error:`Webhook handler failed: ${e.message}`},{status:500})}}async function b(e){console.log("\uD83C\uDF89 Checkout Session Completed:",e.id);let t=e.customer;e.subscription;let o=(0,g.N)(e.id);if(!o&&(console.error("❌ Dados tempor\xe1rios n\xe3o encontrados para session:",e.id),!e.metadata?.email))throw Error("Dados do usu\xe1rio n\xe3o encontrados");let a=o||{email:e.metadata.email,password:"",name:e.metadata.name,businessName:e.metadata.businessName,segmentType:e.metadata.segmentType,phone:e.metadata.phone,customerId:t,timestamp:Date.now()},r=await c.prisma.user.findFirst({where:{OR:[{AND:[{email:a.email},{role:"MASTER"}]},{stripeCustomerId:t}]}});if(r){console.log("ℹ️ Usu\xe1rio j\xe1 existe, atualizando dados do Stripe..."),await c.prisma.user.update({where:{id:r.id},data:{stripeCustomerId:t,planType:"STANDARD"}}),(0,g.Ps)(e.id);return}console.log("\uD83D\uDC64 Criando usu\xe1rio MASTER...");let s=await u().hash(a.password||"temp_password_12345",12),n=await c.prisma.user.create({data:{email:a.email,password:s,name:a.name,businessName:a.businessName,segmentType:a.segmentType,phone:a.phone,planType:"STANDARD",role:"MASTER",stripeCustomerId:t}});console.log("✅ Usu\xe1rio MASTER criado:",n.id),console.log("\uD83D\uDC65 Criando profissional master..."),console.log("✅ Profissional master criado:",(await c.prisma.user.create({data:{email:a.email,password:s,name:a.name,businessName:a.businessName,segmentType:a.segmentType,phone:a.phone,whatsapp:a.phone,role:"PROFESSIONAL",masterId:n.id,isActive:!0,planType:"STANDARD"}})).id),console.log("⚙️ Criando BusinessConfig..."),await c.prisma.businessConfig.create({data:{userId:n.id,workingDays:[1,2,3,4,5],startTime:"08:00",endTime:"18:00",defaultDuration:30,lunchStart:"12:00",lunchEnd:"13:00",multipleServices:!1,requiresDeposit:!1,cancellationHours:24}}),console.log("✅ BusinessConfig criada"),console.log("\uD83D\uDCE7 Enviando email de boas-vindas..."),await f({name:a.name,email:a.email,planName:"Standard",planPrice:"R$ 49,90"}),(0,g.Ps)(e.id),console.log("✅ Processo de cria\xe7\xe3o de usu\xe1rio conclu\xeddo com sucesso!")}async function x(e){let t=e.customer;console.log("\uD83D\uDD04 Assinatura atualizada:",e.id,"Status:",e.status);let o=await c.prisma.user.findFirst({where:{stripeCustomerId:t}});if(!o){console.error("❌ Usu\xe1rio n\xe3o encontrado para customer:",t);return}"active"===e.status?(await c.prisma.user.update({where:{id:o.id},data:{planType:"STANDARD"}}),console.log("✅ Plano do usu\xe1rio atualizado para STANDARD")):["canceled","unpaid","past_due"].includes(e.status)&&(await c.prisma.user.update({where:{id:o.id},data:{planType:"FREEMIUM"}}),console.log("⚠️ Plano do usu\xe1rio revertido para FREEMIUM"))}async function w(e){let t=e.customer;console.log("❌ Assinatura cancelada:",e.id);let o=await c.prisma.user.findFirst({where:{stripeCustomerId:t}});if(!o){console.error("❌ Usu\xe1rio n\xe3o encontrado para customer:",t);return}await c.prisma.user.update({where:{id:o.id},data:{planType:"FREEMIUM"}}),console.log("✅ Usu\xe1rio revertido para plano FREEMIUM")}async function v(e){let t=e.customer;console.log("❌ Pagamento falhou para invoice:",e.id);let o=await c.prisma.user.findFirst({where:{stripeCustomerId:t}});if(!o){console.error("❌ Usu\xe1rio n\xe3o encontrado para customer:",t);return}await m({name:o.name||"Usu\xe1rio",email:o.email}),console.log("\uD83D\uDCE7 Email de falha no pagamento enviado para:",o.email)}let A=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/stripe/webhook/route",pathname:"/api/stripe/webhook",filename:"route",bundlePath:"app/api/stripe/webhook/route"},resolvedPagePath:"C:\\Projetos\\Calenvo\\app\\app\\api\\stripe\\webhook\\route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:C,staticGenerationAsyncStorage:E,serverHooks:k}=A,R="/api/stripe/webhook/route";function P(){return(0,n.patchFetch)({serverHooks:k,staticGenerationAsyncStorage:E})}},9487:(e,t,o)=>{o.d(t,{prisma:()=>r});var a=o(53524);let r=globalThis.prisma??new a.PrismaClient},69206:(e,t,o)=>{o.d(t,{A:()=>r,F:()=>s});var a=o(44273);if(!process.env.STRIPE_SECRET_KEY)throw Error("STRIPE_SECRET_KEY n\xe3o est\xe1 definida nas vari\xe1veis de ambiente");let r=new a.Z(process.env.STRIPE_SECRET_KEY,{apiVersion:"2025-12-15.clover",typescript:!0}),s=process.env.STRIPE_STANDARD_PRICE_ID||"";s||console.warn("⚠️ STRIPE_STANDARD_PRICE_ID n\xe3o est\xe1 definida")},87396:(e,t,o)=>{o.d(t,{N:()=>s,Ps:()=>n,Wl:()=>r});let a=new Map;function r(e,t){a.set(e,t);let o=Date.now()-36e5;for(let[e,t]of a.entries())t.timestamp<o&&a.delete(e)}function s(e){return a.get(e)}function n(e){a.delete(e)}},71615:(e,t,o)=>{o.r(t);var a=o(88757),r={};for(let e in a)"default"!==e&&(r[e]=()=>a[e]);o.d(t,r)},33085:(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return s}});let a=o(45869),r=o(6278);class s{get isEnabled(){return this._provider.isEnabled}enable(){let e=a.staticGenerationAsyncStorage.getStore();return e&&(0,r.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=a.staticGenerationAsyncStorage.getStore();return e&&(0,r.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},88757:(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var o in t)Object.defineProperty(e,o,{enumerable:!0,get:t[o]})}(t,{cookies:function(){return u},draftMode:function(){return f},headers:function(){return p}});let a=o(68996),r=o(53047),s=o(92044),n=o(72934),i=o(33085),l=o(6278),d=o(45869),c=o(54580);function p(){let e="headers",t=d.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return r.HeadersAdapter.seal(new Headers({}));(0,l.trackDynamicDataAccessed)(t,e)}return(0,c.getExpectedRequestStore)(e).headers}function u(){let e="cookies",t=d.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return a.RequestCookiesAdapter.seal(new s.RequestCookies(new Headers({})));(0,l.trackDynamicDataAccessed)(t,e)}let o=(0,c.getExpectedRequestStore)(e),r=n.actionAsyncStorage.getStore();return(null==r?void 0:r.isAction)||(null==r?void 0:r.isAppRoute)?o.mutableCookies:o.cookies}function f(){let e=(0,c.getExpectedRequestStore)("draftMode");return new i.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},53047:(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var o in t)Object.defineProperty(e,o,{enumerable:!0,get:t[o]})}(t,{HeadersAdapter:function(){return s},ReadonlyHeadersError:function(){return r}});let a=o(38238);class r extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new r}}class s extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,o,r){if("symbol"==typeof o)return a.ReflectAdapter.get(t,o,r);let s=o.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===s);if(void 0!==n)return a.ReflectAdapter.get(t,n,r)},set(t,o,r,s){if("symbol"==typeof o)return a.ReflectAdapter.set(t,o,r,s);let n=o.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===n);return a.ReflectAdapter.set(t,i??o,r,s)},has(t,o){if("symbol"==typeof o)return a.ReflectAdapter.has(t,o);let r=o.toLowerCase(),s=Object.keys(e).find(e=>e.toLowerCase()===r);return void 0!==s&&a.ReflectAdapter.has(t,s)},deleteProperty(t,o){if("symbol"==typeof o)return a.ReflectAdapter.deleteProperty(t,o);let r=o.toLowerCase(),s=Object.keys(e).find(e=>e.toLowerCase()===r);return void 0===s||a.ReflectAdapter.deleteProperty(t,s)}})}static seal(e){return new Proxy(e,{get(e,t,o){switch(t){case"append":case"delete":case"set":return r.callable;default:return a.ReflectAdapter.get(e,t,o)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new s(e)}append(e,t){let o=this.headers[e];"string"==typeof o?this.headers[e]=[o,t]:Array.isArray(o)?o.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[o,a]of this.entries())e.call(t,a,o,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),o=this.get(t);yield[t,o]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},68996:(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var o in t)Object.defineProperty(e,o,{enumerable:!0,get:t[o]})}(t,{MutableRequestCookiesAdapter:function(){return p},ReadonlyRequestCookiesError:function(){return n},RequestCookiesAdapter:function(){return i},appendMutableCookies:function(){return c},getModifiedCookieValues:function(){return d}});let a=o(92044),r=o(38238),s=o(45869);class n extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new n}}class i{static seal(e){return new Proxy(e,{get(e,t,o){switch(t){case"clear":case"delete":case"set":return n.callable;default:return r.ReflectAdapter.get(e,t,o)}}})}}let l=Symbol.for("next.mutated.cookies");function d(e){let t=e[l];return t&&Array.isArray(t)&&0!==t.length?t:[]}function c(e,t){let o=d(t);if(0===o.length)return!1;let r=new a.ResponseCookies(e),s=r.getAll();for(let e of o)r.set(e);for(let e of s)r.set(e);return!0}class p{static wrap(e,t){let o=new a.ResponseCookies(new Headers);for(let t of e.getAll())o.set(t);let n=[],i=new Set,d=()=>{let e=s.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),n=o.getAll().filter(e=>i.has(e.name)),t){let e=[];for(let t of n){let o=new a.ResponseCookies(new Headers);o.set(t),e.push(o.toString())}t(e)}};return new Proxy(o,{get(e,t,o){switch(t){case l:return n;case"delete":return function(...t){i.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{d()}};case"set":return function(...t){i.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{d()}};default:return r.ReflectAdapter.get(e,t,o)}}})}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),a=t.X(0,[9276,2023,5972,2749,4273],()=>o(55598));module.exports=a})();