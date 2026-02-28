import supabase from '../config/supabase.js';
import bcrypt from 'bcrypt';
import generateToken from '../utils/generateToken.js';

const registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;


    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      const message = process.env.NODE_ENV === 'development'
        ? (checkError.message || JSON.stringify(checkError))
        : 'Failed to check existing user';
      return res.status(500).json({ error: message });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, name }])
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ error: insertError.message || 'Failed to register user' });
    }

    
    const token = generateToken(newUser.id);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user || fetchError) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    
    const token = generateToken(user.id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export { registerUser, loginUser };
