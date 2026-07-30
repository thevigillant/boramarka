import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-[#050507] text-white/90">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">Voltar</span>
          </Link>
          <h1 className="text-lg font-semibold text-white">Política de Privacidade</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-invert prose-sm max-w-none
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-4
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white/90 [&_h3]:mt-6 [&_h3]:mb-3
          [&_p]:text-white/70 [&_p]:leading-relaxed [&_p]:mb-4
          [&_ul]:text-white/70 [&_ul]:mb-4 [&_ul]:pl-5
          [&_li]:mb-2 [&_li]:leading-relaxed
          [&_strong]:text-white/90
          [&_table]:w-full [&_table]:border-collapse
          [&_th]:text-left [&_th]:text-white/80 [&_th]:py-3 [&_th]:px-4 [&_th]:border-b [&_th]:border-white/10
          [&_td]:text-white/60 [&_td]:py-3 [&_td]:px-4 [&_td]:border-b [&_td]:border-white/[0.06]
        ">
          <p className="text-white/50 text-sm mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          <p>
            A <strong>BoraMarka</strong>, operada por <strong>Bruno Santana Reis — MEI</strong>, 
            valoriza e respeita a privacidade dos seus Usuários. Esta Política de Privacidade 
            ("Política") descreve como coletamos, usamos, armazenamos e protegemos suas informações 
            pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
          </p>

          <h2>1. Dados Pessoais Coletados</h2>
          <p>Coletamos os seguintes tipos de dados pessoais:</p>

          <h3>1.1. Dados fornecidos pelo Usuário</h3>
          <table>
            <thead>
              <tr>
                <th>Dado</th>
                <th>Finalidade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nome, e-mail, telefone</td>
                <td>Cadastro e identificação na plataforma</td>
              </tr>
              <tr>
                <td>CNPJ, endereço comercial</td>
                <td>Configuração do perfil profissional</td>
              </tr>
              <tr>
                <td>Dados de colaboradores (CPF, RG, dados bancários)</td>
                <td>Módulo de RH e gestão de equipe</td>
              </tr>
              <tr>
                <td>Dados de clientes agendados (nome, telefone)</td>
                <td>Gestão de agendamentos e comunicação</td>
              </tr>
              <tr>
                <td>Credenciais de acesso (senha criptografada)</td>
                <td>Autenticação e segurança da conta</td>
              </tr>
            </tbody>
          </table>

          <h3>1.2. Dados coletados automaticamente</h3>
          <table>
            <thead>
              <tr>
                <th>Dado</th>
                <th>Finalidade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Endereço IP</td>
                <td>Segurança, logs de auditoria e prevenção de fraudes</td>
              </tr>
              <tr>
                <td>User-Agent (navegador e SO)</td>
                <td>Compatibilidade e diagnóstico técnico</td>
              </tr>
              <tr>
                <td>Dados de uso da plataforma</td>
                <td>Melhoria contínua do serviço</td>
              </tr>
            </tbody>
          </table>

          <h2>2. Base Legal para o Tratamento (Art. 7º, LGPD)</h2>
          <p>Tratamos seus dados pessoais com fundamento nas seguintes bases legais:</p>
          <ul>
            <li><strong>Execução de contrato</strong> (Art. 7º, V): para prestar o serviço de agendamento e gestão contratado</li>
            <li><strong>Consentimento</strong> (Art. 7º, I): para envio de comunicações de marketing e notificações opcionais</li>
            <li><strong>Legítimo interesse</strong> (Art. 7º, IX): para melhorias na plataforma, segurança e prevenção de fraudes</li>
            <li><strong>Cumprimento de obrigação legal</strong> (Art. 7º, II): para retenção de dados fiscais e contábeis</li>
          </ul>

          <h2>3. Como Usamos Seus Dados</h2>
          <p>Utilizamos os dados coletados para:</p>
          <ul>
            <li>Criar e gerenciar sua conta na plataforma</li>
            <li>Processar agendamentos e pagamentos via Mercado Pago</li>
            <li>Enviar lembretes de agendamento via WhatsApp e Web Push</li>
            <li>Enviar e-mails transacionais (verificação de conta, reset de senha)</li>
            <li>Gerar relatórios financeiros e analytics</li>
            <li>Garantir a segurança da plataforma (logs de auditoria, detecção de anomalias)</li>
            <li>Melhorar e personalizar a experiência do Usuário</li>
          </ul>

          <h2>4. Compartilhamento de Dados</h2>
          <p>Seus dados pessoais podem ser compartilhados com:</p>
          <ul>
            <li><strong>Mercado Pago</strong> — processamento de pagamentos (PIX e cartão)</li>
            <li><strong>Google (Gmail SMTP)</strong> — envio de e-mails transacionais</li>
            <li><strong>Meta (WhatsApp Cloud API)</strong> — envio de notificações via WhatsApp (quando configurado)</li>
            <li><strong>Provedor de hospedagem</strong> — armazenamento seguro de dados</li>
          </ul>
          <p>
            <strong>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros 
            para fins de marketing ou publicidade.</strong>
          </p>

          <h2>5. Armazenamento e Segurança</h2>
          <p>Adotamos as seguintes medidas de segurança:</p>
          <ul>
            <li>Senhas criptografadas com <strong>bcrypt</strong> (hash unidirecional)</li>
            <li>Comunicação via <strong>HTTPS/TLS</strong> em todas as conexões</li>
            <li>Autenticação via <strong>JWT</strong> (JSON Web Token) com expiração</li>
            <li><strong>Rate limiting</strong> para proteção contra ataques de força bruta e DoS</li>
            <li><strong>Helmet</strong> (headers de segurança HTTP)</li>
            <li><strong>CORS</strong> restrito a origens autorizadas</li>
            <li><strong>Logs de auditoria</strong> com registro de IP e user-agent</li>
          </ul>
          <p>
            Os dados são armazenados em banco de dados relacional (PostgreSQL em produção), 
            hospedado em servidores seguros com acesso restrito.
          </p>

          <h2>6. Retenção de Dados</h2>
          <p>
            Seus dados pessoais são mantidos pelo tempo necessário para a prestação do serviço 
            e cumprimento de obrigações legais. Após o encerramento da conta:
          </p>
          <ul>
            <li><strong>Dados da conta e perfil:</strong> excluídos em até 30 dias</li>
            <li><strong>Dados financeiros:</strong> mantidos por até 5 anos (obrigação fiscal)</li>
            <li><strong>Logs de auditoria:</strong> mantidos por até 6 meses</li>
          </ul>

          <h2>7. Direitos do Titular (Art. 18, LGPD)</h2>
          <p>Você tem direito a:</p>
          <ul>
            <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e obter cópia deles</li>
            <li><strong>Correção:</strong> atualizar dados incompletos, inexatos ou desatualizados</li>
            <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou excessivos</li>
            <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
            <li><strong>Eliminação:</strong> solicitar a exclusão de dados tratados com base em consentimento</li>
            <li><strong>Revogação do consentimento:</strong> a qualquer momento</li>
            <li><strong>Oposição:</strong> ao tratamento de dados quando houver descumprimento da LGPD</li>
          </ul>
          <p>
            Para exercer esses direitos, entre em contato pelo e-mail:{' '}
            <strong>contatoboramarka@gmail.com</strong>. Responderemos em até 15 dias úteis.
          </p>

          <h2>8. Cookies e Tecnologias Similares</h2>
          <p>
            A Plataforma utiliza <strong>localStorage</strong> e <strong>sessionStorage</strong> do 
            navegador para armazenar tokens de autenticação e preferências do Usuário. 
            Não utilizamos cookies de rastreamento de terceiros.
          </p>

          <h2>9. Transferência Internacional de Dados</h2>
          <p>
            Alguns de nossos provedores de serviços (como a infraestrutura de hospedagem e APIs de terceiros) 
            podem estar localizados fora do Brasil. Nesses casos, garantimos que a transferência 
            é feita em conformidade com o Art. 33 da LGPD, incluindo a verificação de nível 
            adequado de proteção de dados.
          </p>

          <h2>10. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta Política periodicamente. Quaisquer alterações significativas 
            serão comunicadas por e-mail ou notificação na Plataforma. O uso continuado da 
            Plataforma após a publicação das alterações constitui aceitação da Política atualizada.
          </p>

          <h2>11. Encarregado de Dados (DPO)</h2>
          <p>
            Para questões relacionadas à proteção de dados pessoais, nosso Encarregado de 
            Dados pode ser contatado pelo e-mail:
          </p>
          <ul>
            <li><strong>E-mail:</strong> contatoboramarka@gmail.com</li>
            <li><strong>Site:</strong> <a href="https://boramarka.com.br" className="text-violet-400 hover:text-violet-300">boramarka.com.br</a></li>
          </ul>

          <h2>12. Autoridade Nacional de Proteção de Dados</h2>
          <p>
            Caso entenda que o tratamento de dados pessoais realizado pelo BoraMarka viola a LGPD, 
            o titular pode apresentar reclamação à <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>:{' '}
            <a href="https://www.gov.br/anpd" className="text-violet-400 hover:text-violet-300" target="_blank" rel="noopener noreferrer">
              www.gov.br/anpd
            </a>
          </p>

          <div className="mt-16 pt-8 border-t border-white/[0.06]">
            <p className="text-white/40 text-xs text-center">
              © {new Date().getFullYear()} BoraMarka — Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
