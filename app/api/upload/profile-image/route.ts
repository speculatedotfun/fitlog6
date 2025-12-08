import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create admin client for server-side operations
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Missing file or userId' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Always use admin client for server-side operations to bypass RLS
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for image uploads',
          errorCode: 'MISSING_SERVICE_KEY'
        },
        { status: 500 }
      );
    }
    
    const client = supabaseAdmin;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await client.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // Check if bucket doesn't exist
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        return NextResponse.json(
          { 
            error: 'Bucket not found. Please create the "avatars" bucket in Supabase Storage. See PROFILE_IMAGE_SETUP.md for instructions.',
            errorCode: 'BUCKET_NOT_FOUND'
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: uploadError.message || 'Failed to upload image',
          errorCode: 'UPLOAD_ERROR'
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Update user record with image URL
    const { error: updateError } = await client
      .from('users')
      .update({ profile_image_url: imageUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      
      // Check if it's an RLS error
      if (updateError.message?.includes('row-level security') || updateError.code === '42501') {
        return NextResponse.json(
          { 
            error: 'RLS policy error. Please run fix-users-rls-policy.sql in Supabase SQL Editor.',
            errorCode: 'RLS_POLICY_ERROR',
            details: updateError.message
          },
          { status: 403 }
        );
      }
      
      // Still return success since image was uploaded
      return NextResponse.json({
        url: imageUrl,
        warning: 'Image uploaded but failed to update user record',
        error: updateError.message
      });
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error: any) {
    console.error('Error in profile image upload API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

