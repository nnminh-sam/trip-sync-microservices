/**
 * Script to disable Uniform Bucket-Level Access and enable ACLs for GCS bucket
 * This allows fine-grained access control on individual objects
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');
require('dotenv').config();

async function disableUniformBucketLevelAccess() {
  try {
    // Initialize GCS client
    const storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID || 'trip-sync-project',
      keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, '../gcs-credentials.json'),
    });

    const bucketName = process.env.GCS_BUCKET_NAME || 'trip-sync-files';
    const bucket = storage.bucket(bucketName);

    console.log(`\n🔧 Processing bucket: ${bucketName}`);
    console.log('=====================================');

    // Get current bucket metadata
    const [metadata] = await bucket.getMetadata();
    
    console.log('\n📊 Current bucket configuration:');
    console.log('--------------------------------');
    
    if (metadata.iamConfiguration && metadata.iamConfiguration.uniformBucketLevelAccess) {
      const ubla = metadata.iamConfiguration.uniformBucketLevelAccess;
      console.log(`Uniform Bucket-Level Access enabled: ${ubla.enabled}`);
      
      if (ubla.enabled) {
        console.log(`Locked time: ${ubla.lockedTime || 'Not locked'}`);
        
        // Check if the bucket is locked
        if (ubla.lockedTime) {
          const lockedDate = new Date(ubla.lockedTime);
          console.log(`\n⚠️  WARNING: Bucket has been locked since ${lockedDate.toISOString()}`);
          console.log('Once locked, Uniform Bucket-Level Access cannot be disabled.');
          console.log('You would need to create a new bucket without Uniform Bucket-Level Access.');
          return;
        }

        // Disable Uniform Bucket-Level Access
        console.log('\n🔄 Disabling Uniform Bucket-Level Access...');
        
        await bucket.setMetadata({
          iamConfiguration: {
            uniformBucketLevelAccess: {
              enabled: false,
            },
          },
        });

        console.log('✅ Uniform Bucket-Level Access has been disabled!');
        console.log('✅ ACLs are now enabled for the bucket.');
        
        // Set default ACL for new objects (optional)
        console.log('\n🔒 Setting default ACLs for new objects...');
        
        // Make new objects private by default
        await bucket.acl.default.add({
          entity: 'projectPrivate',
          role: storage.acl.OWNER_ROLE,
        });
        
        console.log('✅ Default ACL configured: New objects will be private by default');
        
        // Verify the change
        const [updatedMetadata] = await bucket.getMetadata();
        console.log('\n✨ Updated bucket configuration:');
        console.log('--------------------------------');
        console.log(`Uniform Bucket-Level Access enabled: ${updatedMetadata.iamConfiguration.uniformBucketLevelAccess.enabled}`);
        
      } else {
        console.log('\n✅ Uniform Bucket-Level Access is already disabled.');
        console.log('✅ ACLs are enabled for this bucket.');
      }
    } else {
      console.log('✅ This bucket uses ACLs (Uniform Bucket-Level Access is not enabled).');
    }

    console.log('\n📝 Notes:');
    console.log('--------');
    console.log('1. With ACLs enabled, you can set permissions on individual objects');
    console.log('2. You can use object.acl.add() to grant access to specific users/groups');
    console.log('3. Remember to set appropriate ACLs when uploading new files');
    console.log('\nExample ACL operations:');
    console.log('  - Make object public: file.makePublic()');
    console.log('  - Make object private: file.makePrivate()');
    console.log('  - Grant read access: file.acl.add({entity: "user-email@example.com", role: "READER"})');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 404) {
      console.error('Bucket not found. Please check the bucket name.');
    } else if (error.code === 403) {
      console.error('Permission denied. Please check your service account permissions.');
      console.error('Required permission: storage.buckets.update');
    } else {
      console.error('Full error:', error);
    }
    
    process.exit(1);
  }
}

// Run the script
console.log('🚀 GCS Bucket ACL Configuration Script');
console.log('======================================');
disableUniformBucketLevelAccess()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });