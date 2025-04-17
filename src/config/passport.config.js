const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user.model');

passport.use('github', new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('AccessToken:', accessToken);
    console.log('refreshToken:', refreshToken);
    console.log("GitHubStrategy chamada.");
    console.log(profile);

    if (profile._json && profile._json.email && profile._json.name) {
      let user = await User.findOne({ email: profile._json.email });

      if (!user) {
        const nameParts = profile.displayName ? profile.displayName.split(' ') : [];
        const firstName = nameParts.length > 0 ? nameParts[0] : 'GitHub'; // Valor padrão se não houver nome
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User'; // Valor padrão se não houver sobrenome

        const newUser = {
          first_name: firstName,
          last_name: lastName,
          email: profile._json.email,
          githubId: profile.id, // Salvar o ID do GitHub
          password: null, // Senha nula para logins via GitHub
          role: 'user', // Definir role padrão
          last_connection: new Date(),
        };
        const result = await User.create(newUser);
        return done(null, result);
      } else {
        // Atualizar last_connection ao logar
        user.last_connection = new Date();
        await user.save();
        return done(null, user);
      }
    } else {
      return done("Erro: Dados do perfil do GitHub incompletos.");
    }
  } catch (error) {
    console.error("Erro na GitHubStrategy:", error);
    return done(error);
  }
}));

passport.use('login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true, // Permite passar o req para o callback
}, async (req, email, password, done) => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log('Usuário não encontrado - ' + email);
      return done(null, false, req.flash('loginMessage', 'Usuário não encontrado.'));
    }

    if (!user.password) {
      console.log('Login via GitHub - ' + email);
      return done(null, false, req.flash('loginMessage', 'Por favor, faça login usando o GitHub.'));
    }

    const isValid = await user.isValidPassword(password);
    if (!isValid) {
      console.log('Senha inválida para o usuário ' + email);
      return done(null, false, req.flash('loginMessage'));
    }

    // Atualizar last_connection ao logar
    user.last_connection = new Date();
    await user.save();

    return done(null, user);
  } catch (error) {
    console.log('Erro ao logar o usuário ' + email + ': ' + error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;