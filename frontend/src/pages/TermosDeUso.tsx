import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-[#050507] text-white/90">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">Voltar</span>
          </Link>
          <h1 className="text-lg font-semibold text-white">Termos de Uso</h1>
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
        ">
          <p className="text-white/50 text-sm mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar, criar conta ou utilizar a plataforma <strong>BoraMarka</strong> ("Plataforma"), 
            operada por <strong>Bruno Santana Reis — MEI</strong>, CNPJ sob consulta, 
            você ("Usuário") declara que leu, compreendeu e concorda integralmente com estes Termos de Uso ("Termos"). 
            Caso não concorde, não utilize a Plataforma.
          </p>

          <h2>2. Descrição do Serviço</h2>
          <p>
            O BoraMarka é uma plataforma SaaS (Software as a Service) de agendamento online e gestão inteligente 
            destinada a profissionais autônomos, estúdios, clínicas e estabelecimentos comerciais que atendem 
            com hora marcada. A plataforma oferece funcionalidades como:
          </p>
          <ul>
            <li>Agendamento online 24/7 com links personalizados</li>
            <li>Cobrança de sinal antecipado via Mercado Pago (PIX e Cartão)</li>
            <li>Gestão de equipe e colaboradores</li>
            <li>Módulo de RH (controle de ponto, folha, férias)</li>
            <li>Cartão fidelidade digital e cupons de desconto</li>
            <li>Notificações automáticas via WhatsApp e Web Push</li>
            <li>Fluxo de caixa e relatórios financeiros</li>
            <li>CRM e chat com clientes</li>
          </ul>

          <h2>3. Cadastro e Conta</h2>
          <p>
            Para utilizar a Plataforma, o Usuário deve criar uma conta fornecendo informações verdadeiras, 
            completas e atualizadas. O Usuário é o único responsável por manter a confidencialidade 
            de suas credenciais de acesso (nome de usuário e senha) e por todas as atividades 
            realizadas em sua conta.
          </p>
          <p>
            O Usuário compromete-se a:
          </p>
          <ul>
            <li>Não compartilhar suas credenciais com terceiros não autorizados</li>
            <li>Notificar imediatamente o BoraMarka em caso de uso não autorizado da conta</li>
            <li>Manter seus dados cadastrais atualizados</li>
          </ul>

          <h2>4. Planos, Preços e Pagamento</h2>
          <h3>4.1. Planos Disponíveis</h3>
          <p>
            A Plataforma oferece diferentes planos de assinatura (BoraTestar, BoraMensal, BoraAnual, BoraPremium), 
            cada um com suas respectivas cotas e funcionalidades, conforme descrito na página de preços.
          </p>
          <h3>4.2. Período de Teste</h3>
          <p>
            Novos usuários recebem um período de teste gratuito de 7 (sete) dias ("BoraTestar") 
            com acesso limitado às funcionalidades da Plataforma. Ao término do período de teste, 
            o Usuário deverá assinar um plano pago para continuar utilizando o serviço.
          </p>
          <h3>4.3. Pagamento</h3>
          <p>
            Os pagamentos são processados através do Mercado Pago. O BoraMarka não armazena 
            dados de cartão de crédito. Todos os valores são expressos em Reais (BRL) e 
            incluem os impostos aplicáveis.
          </p>
          <h3>4.4. Cancelamento e Reembolso</h3>
          <p>
            O Usuário pode cancelar sua assinatura a qualquer momento. O acesso permanecerá 
            ativo até o final do período já pago. Não há reembolso proporcional para cancelamentos 
            antes do término do período de vigência, exceto nos casos previstos pelo Código de 
            Defesa do Consumidor.
          </p>

          <h2>5. Uso Aceitável</h2>
          <p>O Usuário compromete-se a não:</p>
          <ul>
            <li>Utilizar a Plataforma para fins ilícitos ou não autorizados</li>
            <li>Tentar acessar áreas restritas, sistemas ou redes sem autorização</li>
            <li>Interferir ou interromper a integridade ou o desempenho da Plataforma</li>
            <li>Enviar conteúdo ofensivo, difamatório, ilegal ou que viole direitos de terceiros</li>
            <li>Utilizar a Plataforma para enviar spam ou comunicações não solicitadas</li>
            <li>Revender, sublicenciar ou redistribuir o acesso à Plataforma</li>
          </ul>

          <h2>6. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo da Plataforma, incluindo mas não se limitando a código-fonte, design, 
            logotipos, textos, gráficos, ícones e software, é de propriedade exclusiva do BoraMarka 
            e está protegido pelas leis de propriedade intelectual brasileiras e internacionais.
          </p>
          <p>
            Os dados inseridos pelo Usuário na Plataforma (informações de clientes, agendamentos, 
            transações) permanecem de propriedade do Usuário.
          </p>

          <h2>7. Disponibilidade e Suporte</h2>
          <p>
            O BoraMarka empenhará esforços comercialmente razoáveis para manter a Plataforma disponível 
            24 horas por dia, 7 dias por semana. No entanto, o serviço pode sofrer interrupções 
            temporárias para manutenção, atualizações ou por motivos fora de nosso controle.
          </p>

          <h2>8. Limitação de Responsabilidade</h2>
          <p>
            Na máxima extensão permitida pela legislação aplicável, o BoraMarka não será responsável 
            por danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo 
            perda de lucros, dados, uso ou outras perdas intangíveis.
          </p>

          <h2>9. Modificações dos Termos</h2>
          <p>
            O BoraMarka reserva-se o direito de modificar estes Termos a qualquer momento. 
            As alterações entrarão em vigor após a publicação na Plataforma. O uso continuado 
            da Plataforma após a publicação das alterações constitui aceitação dos novos Termos.
          </p>

          <h2>10. Legislação Aplicável e Foro</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. 
            Para dirimir quaisquer controvérsias decorrentes destes Termos, fica eleito 
            o foro da comarca do domicílio do Usuário, nos termos do Art. 101, I, do Código 
            de Defesa do Consumidor.
          </p>

          <h2>11. Contato</h2>
          <p>
            Para dúvidas, sugestões ou reclamações sobre estes Termos, entre em contato:
          </p>
          <ul>
            <li><strong>E-mail:</strong> contatoboramarka@gmail.com</li>
            <li><strong>Site:</strong> <a href="https://boramarka.com.br" className="text-violet-400 hover:text-violet-300">boramarka.com.br</a></li>
          </ul>

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
