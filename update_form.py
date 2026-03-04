import os
import re

file_path = 'frontend/components/AddMemberForm.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import_statement = """import PersonalInfoTab from './PersonalInfoTab';
import AddressTab from './AddressTab';
import FamilyTab from './FamilyTab';
import DocumentsTab from './DocumentsTab';
import ReviewTab from './ReviewTab';
"""
content = content.replace("import ConfirmModal from './ConfirmModal';", import_statement + "import ConfirmModal from './ConfirmModal';")

content = re.sub(r'\{\/\* STEP 1: IDENTITY \*\/.*?\{\/\* STEP 2: LOCATION \*\/\}',
                 '{/* STEP 1: IDENTITY */}\n          {step === 1 && (\n            <PersonalInfoTab\n              formData={formData}\n              setFormData={setFormData}\n              applicantType={applicantType}\n              isSeniorRole={isSeniorRole}\n              isMatchFound={isMatchFound}\n              lookupLoading={lookupLoading}\n            />\n          )}\n\n          {/* STEP 2: LOCATION */}', content, flags=re.DOTALL)

content = re.sub(r'\{\/\* STEP 2: LOCATION \*\/.*?\{\/\* STEP 3: FAMILY \*\/\}',
                 '{/* STEP 2: LOCATION */}\n          {step === 2 && (\n            <AddressTab\n              formData={formData}\n              setFormData={setFormData}\n            />\n          )}\n\n          {/* STEP 3: FAMILY */}', content, flags=re.DOTALL)

content = re.sub(r'\{\/\* STEP 3: FAMILY \*\/.*?\{\/\* STEP 4: DOCS \*\/\}',
                 '{/* STEP 3: FAMILY */}\n          {step === 3 && (\n            <FamilyTab\n              formData={formData}\n              setFormData={setFormData}\n              tempMember={tempMember}\n              setTempMember={setTempMember}\n              addFamilyMember={addFamilyMember}\n              removeFamilyMember={removeFamilyMember}\n            />\n          )}\n\n          {/* STEP 4: DOCS */}', content, flags=re.DOTALL)

content = re.sub(r'\{\/\* STEP 4: DOCS \*\/.*?\{\/\* STEP 5: REVIEW - Same as before \*\/\}',
                 '{/* STEP 4: DOCS */}\n          {step === 4 && (\n            <DocumentsTab\n              formData={formData}\n              setFormData={setFormData}\n              applicantType={applicantType}\n              uploadedFiles={uploadedFiles}\n              handleFileChange={handleFileChange}\n              showPassword={showPassword}\n              setShowPassword={setShowPassword}\n              showConfirmPassword={showConfirmPassword}\n              setShowConfirmPassword={setShowConfirmPassword}\n              passwordHasMin={passwordHasMin}\n              passwordHasNumber={passwordHasNumber}\n              passwordHasSpecial={passwordHasSpecial}\n            />\n          )}\n\n          {/* STEP 5: REVIEW - Same as before */}', content, flags=re.DOTALL)

content = re.sub(r'\{\/\* STEP 5: REVIEW - Same as before \*\/.*?<div className="flex flex-col sm:flex-row',
                 '{/* STEP 5: REVIEW - Same as before */}\n          {step === 5 && (\n            <ReviewTab formData={formData} applicantType={applicantType} />\n          )}\n\n          <div className="flex flex-col sm:flex-row', content, flags=re.DOTALL)

content = re.sub(r'const ReviewField = \(\{.*?\}\)\s*=>\s*\([\s\S]*?\n  \);\n', '', content)
content = re.sub(r'const FileUploadField = \(\{.*?\}\)\s*=>\s*\([\s\S]*?\n    </div>\n  \);\n', '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated AddMemberForm.tsx successfully.")
