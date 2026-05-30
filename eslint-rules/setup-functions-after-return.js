/**
 * Custom ESLint rule: in a Vue Options API `setup()` function, every top-level
 * `function` declaration must appear AFTER the `return` statement. This relies
 * on hoisting and matches the convention used across this codebase — see
 * src/views/auth/LoginView.vue for a canonical example.
 *
 * Only flags `FunctionDeclaration` nodes (arrow functions assigned to const are
 * not hoisted, so they must stay before the return and aren't checked).
 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Vue setup() function declarations must be placed after the return statement (relies on hoisting).'
    },
    schema: [],
    messages: {
      moveAfterReturn:
        "Function declaration '{{name}}' must be placed after the `return` statement in setup() (relies on hoisting)."
    }
  },
  create(context) {
    function check(blockBody) {
      let returnIdx = -1

      for (let i = 0; i < blockBody.length; i++) {
        if (blockBody[i].type === 'ReturnStatement') {
          returnIdx = i
          break
        }
      }

      if (returnIdx === -1) return

      for (let i = 0; i < returnIdx; i++) {
        const stmt = blockBody[i]

        if (stmt.type === 'FunctionDeclaration') {
          context.report({
            node: stmt,
            messageId: 'moveAfterReturn',
            data: { name: stmt.id ? stmt.id.name : '<anonymous>' }
          })
        }
      }
    }

    function isSetup(node) {
      // Property in an object literal: setup() { ... } or setup: function() { ... }
      const parent = node.parent
      if (!parent) return false
      if (parent.type === 'Property' && parent.key && parent.key.name === 'setup') return true
      if (parent.type === 'MethodDefinition' && parent.key && parent.key.name === 'setup')
        return true
      return false
    }

    return {
      'FunctionExpression > BlockStatement'(node) {
        if (!isSetup(node.parent)) return
        check(node.body)
      },
      'FunctionDeclaration > BlockStatement'(node) {
        // setup() declared as a method shorthand: setup(props) { ... } in an
        // object literal also lands here when parsed in some configurations.
        if (!isSetup(node.parent)) return
        check(node.body)
      }
    }
  }
}
