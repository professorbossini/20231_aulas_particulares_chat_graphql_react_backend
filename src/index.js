import { createSchema, createYoga, createPubSub } from "graphql-yoga";
import { createServer } from 'node:http'

const pubSub = createPubSub()

const usuarios = [
  {
    id: "1",
    nome: "Fernanda",
    senha: "123456"
  }
]

const ambientes = [
  {
    id: "11",
    nome: "geral"
  }
]

const participacoes = [
  {
    id: "101",
    usuario: "1",
    ambiente: "11",
    entrada: "2022-12-18 00:00:00",
    saida: null
  }
]

const mensagens = [
  {
    id: "1001",
    texto: "Nosso dia",
    usuario: "1",
    ambiente: "11",
    data: '2022-12-18 18:44:00'
  }
]

const schema = createSchema({
  typeDefs: `
    type Usuario{
      id: ID!
      nome: String!
      senha: String!
      mensagens: [Mensagem!]!
      ambientes: [Ambiente!]!
    }

    type Mensagem {
      id: ID!
      texto: String!
      usuario: Usuario!
      ambiente: Ambiente!
      data: String!
    }

    type Ambiente {
      id: ID!
      nome: String!
      usuarios: [Usuario!]!
      mensagens: [Mensagem!]!
    }

    type Participacao{
      id: ID!
      usuario: Usuario!
      ambiente: Ambiente!
      entrada: String!
      saida: String
    }
    type Query{
      hello: String!
      ambientes: [Ambiente!]!
      existe (nome: String!, senha: String!): Usuario
      usuariosOnline(ambiente: ID!): [Usuario!]!
      mensagensPorAmbiente(ambiente: ID!): [Mensagem!]!
    }

    type Mutation{
      registrarEntrada(usuario: ID!, ambiente: ID!): Participacao!
      registrarSaida(usuario: ID!, ambiente: ID!): Participacao!
      registrarMensagem(texto: String!, usuario: ID!, ambiente: ID!): Mensagem!
    }

    type Subscription{
      novaMensagem(ambiente: ID!): Mensagem!
      usuarioEntrou(ambiente: ID!): Usuario!
      usuarioSaiu(ambiente: ID!): Usuario!
    }
  `,
  resolvers: {
    Query: {
      hello: () => "Hello, GraphQL!",
      ambientes: () => ambientes,
      existe: (parent, args, context, info) => {
        const { nome, senha } = args
        return usuarios.find(u => u.nome === nome && u.senha === senha)
      },
      usuariosOnline: (parent, args, context, info) => {
        const idUsuarios = participacoes.filter(p => p.ambiente === args.ambiente && p.saida === null).map(p => p.usuario)
        return usuarios.filter(u => idUsuarios.includes(u.id))
      },
      mensagensPorAmbiente: (parent, args, context, info) => {
        return mensagens.filter(m => m.ambiente === args.ambiente)  
      }
    },
    Mutation: {
      registrarEntrada: (parent, args, context, info) => {
        const { usuario, ambiente }  = args
        const p = {
          id: Math.random().toString(36).substring(2, 9),
          usuario,
          ambiente,
          entrada: new Date().toISOString(),
          saida: null
        }
        participacoes.push(p)
        context.pubSub.publish(
          `A${args.ambiente}: Novo Usuario`,
          {usuarioEntrou: usuarios.find(u => u.id === usuario)}
        )
        return p
      },
      registrarSaida: (parent, args, context, info) => {
        const { usuario, ambiente } = args
        const p = participacoes.find(p => p.usuario === usuario && p.ambiente === ambiente && p.saida === null)
        p.saida = new Date().toISOString()
        context.pubSub.publish(
          `A${args.ambiente}: Usuario Saiu`,
          {usuarioSaiu: usuarios.find(u => u.id === usuario)}
        )
        return p
      },
      registrarMensagem: (parent, args, context, info) => {
        const { texto, usuario, ambiente } = args
        const { pubSub } = context
        const m = {
          id: Math.random().toString(36).substring(2, 9),
          texto,
          usuario,
          ambiente,
          data: new Date().toISOString()
        }
        mensagens.push(m)
        pubSub.publish(`A${args.ambiente}: Nova Mensagem`, { novaMensagem: m})
        return m
      }
    },
    Subscription: {
      novaMensagem: {
        subscribe: (parent, args, context, info) => {
          //A11: Nova Mensagem
          return context.pubSub.subscribe(`A${args.ambiente}: Nova Mensagem`)
        }
      },
      usuarioEntrou: {
        subscribe: (parent, args, context, info) => {
          //A11: Novo Usuario
          return context.pubSub.subscribe(`A${args.ambiente}: Novo Usuario`)
        }
      },
      usuarioSaiu: {
        subscribe: (parent, args, context, info) => {
          //A11: Usuario Saiu
          return context.pubSub.subscribe(`A${args.ambiente}: Usuario Saiu`)

        }
      }
    },
    Ambiente: {
      usuarios: (parent, args, context, info) => {
        const idUsuarios = participacoes.filter(p => p.ambiente === parent.id).map(p => p.usuario)
        return usuarios.filter(u => idUsuarios.includes(u.id)) 
      },
      mensagens: (parent, args, context, info) => {
        return mensagens.filter(m => m.ambiente === parent.id)  
      }  
    },
    Usuario: {
      mensagens: (parent, args, context, info) => {
        return mensagens.filter(m => m.usuario === parent.id)
      },
      ambientes: (parent, args, context, info) => {
        const idAmbientes = participacoes.filter(p => p.usuario === parent.id).map(p => p.ambiente)
        return ambientes.filter(a => idAmbientes.includes(a.id))    
      }
    }
  }
})



const yoga = createYoga({
  schema,
  context: {pubSub}
})

const server = createServer(yoga)
const port = 4000
server.listen(port, () => {
  `Servidor disponível em http://localhost:${port}`
})