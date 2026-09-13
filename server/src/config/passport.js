import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import db, { isUsingNeon } from './db.js';
import { users } from '../models/schema.js';
import localDb from './localDb.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

// Shared function to find or create a user from OAuth profile
const findOrCreateUser = async (provider, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0]?.value;
    if (!email) {
      return done(new Error(`No email found in ${provider} profile`), null);
    }
    
    const name = profile.displayName || profile.name?.givenName || 'Popcorn Lover';
    const providerId = profile.id;
    const providerIdField = provider === 'google' ? 'googleId' : 'facebookId';

    if (isUsingNeon && db) {
      // 1. Check by Provider ID
      const [userByProvider] = await db.select().from(users).where(eq(users[providerIdField], providerId));
      if (userByProvider) return done(null, userByProvider);

      // 2. Check by Email (link accounts)
      const [userByEmail] = await db.select().from(users).where(eq(users.email, email));
      if (userByEmail) {
        // Link provider ID to existing email
        const [updatedUser] = await db.update(users)
          .set({ [providerIdField]: providerId })
          .where(eq(users.id, userByEmail.id))
          .returning();
        return done(null, updatedUser);
      }

      // 3. Create new user
      const [newUser] = await db.insert(users).values({
        email,
        name,
        [providerIdField]: providerId,
        passwordHash: null,
      }).returning();
      return done(null, newUser);

    } else {
      // Local JSON Database Fallback
      let user = localDb.findOne('users', u => u[providerIdField] === providerId);
      if (user) return done(null, user);

      user = localDb.findOne('users', u => u.email === email);
      if (user) {
        user = localDb.update('users', u => u.id === user.id, { [providerIdField]: providerId });
        return done(null, user);
      }

      user = localDb.insert('users', {
        email,
        name,
        [providerIdField]: providerId,
        passwordHash: null,
        role: 'customer',
        createdAt: new Date().toISOString()
      });
      return done(null, user);
    }
  } catch (err) {
    console.error(`Passport ${provider} error:`, err);
    return done(err, null);
  }
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    scope: ['profile', 'email']
  }, (accessToken, refreshToken, profile, done) => {
    findOrCreateUser('google', profile, done);
  }));
} else {
  console.warn("Passport: Google OAuth missing credentials. Google Login will fail.");
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'emails']
  }, (accessToken, refreshToken, profile, done) => {
    findOrCreateUser('facebook', profile, done);
  }));
} else {
  console.warn("Passport: Facebook OAuth missing credentials. Facebook Login will fail.");
}

// Passport serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

export default passport;
