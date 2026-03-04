const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/components/AddMemberForm.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const importStatement = `import PersonalInfoTab from './PersonalInfoTab';
import AddressTab from './AddressTab';
import FamilyTab from './FamilyTab';
import DocumentsTab from './DocumentsTab';
import ReviewTab from './ReviewTab';
`;
content = content.replace("import ConfirmModal from './ConfirmModal';", importStatement + "import ConfirmModal from './ConfirmModal';");

content = content.replace(/\{\/\* STEP 1: IDENTITY \*\/[\s\S]*?\{\/\* STEP 2: LOCATION \*\/\}/g,
                 `{/* STEP 1: IDENTITY */}
          {step === 1 && (
            <PersonalInfoTab
              formData={formData}
              setFormData={setFormData}
              applicantType={applicantType}
              isSeniorRole={isSeniorRole}
              isMatchFound={isMatchFound}
              lookupLoading={lookupLoading}
            />
          )}

          {/* STEP 2: LOCATION */}`);

content = content.replace(/\{\/\* STEP 2: LOCATION \*\/[\s\S]*?\{\/\* STEP 3: FAMILY \*\/\}/g,
                 `{/* STEP 2: LOCATION */}
          {step === 2 && (
            <AddressTab
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {/* STEP 3: FAMILY */}`);

content = content.replace(/\{\/\* STEP 3: FAMILY \*\/[\s\S]*?\{\/\* STEP 4: DOCS \*\/\}/g,
                 `{/* STEP 3: FAMILY */}
          {step === 3 && (
            <FamilyTab
              formData={formData}
              setFormData={setFormData}
              tempMember={tempMember}
              setTempMember={setTempMember}
              addFamilyMember={addFamilyMember}
              removeFamilyMember={removeFamilyMember}
            />
          )}

          {/* STEP 4: DOCS */}`);

content = content.replace(/\{\/\* STEP 4: DOCS \*\/[\s\S]*?\{\/\* STEP 5: REVIEW - Same as before \*\/\}/g,
                 `{/* STEP 4: DOCS */}
          {step === 4 && (
            <DocumentsTab
              formData={formData}
              setFormData={setFormData}
              applicantType={applicantType}
              uploadedFiles={uploadedFiles}
              handleFileChange={handleFileChange}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              passwordHasMin={passwordHasMin}
              passwordHasNumber={passwordHasNumber}
              passwordHasSpecial={passwordHasSpecial}
            />
          )}

          {/* STEP 5: REVIEW - Same as before */}`);

content = content.replace(/\{\/\* STEP 5: REVIEW - Same as before \*\/[\s\S]*?<div className="flex flex-col sm:flex-row/g,
                 `{/* STEP 5: REVIEW - Same as before */}
          {step === 5 && (
            <ReviewTab formData={formData} applicantType={applicantType} />
          )}

          <div className="flex flex-col sm:flex-row`);

content = content.replace(/const ReviewField = \(\{[\s\S]*?\n  \);\n/, '');
content = content.replace(/const FileUploadField = \(\{[\s\S]*?\n    <\/div>\n  \);\n/, '');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated AddMemberForm.tsx using node.");
