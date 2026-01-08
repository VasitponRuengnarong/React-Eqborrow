const idInput = document.getElementById("idNumber");
const radios = document.querySelectorAll("input[name='type']");
const error = document.getElementById("idError");

const personalInfoRow = document.getElementById("personalInfoRow");
const companyInfoRow = document.getElementById("companyInfoRow");
const authorizedSection = document.getElementById("authorizedSection");
const authListContainer = document.getElementById("authListContainer");
const addAuthBtn = document.getElementById("addAuthBtn");
const submitBtn = document.getElementById("submitBtn");

let maxLen = 13;

// ------------------------------------------
// 1. จัดการ Toggle Fields
// ------------------------------------------
radios.forEach((r) => {
  r.addEventListener("change", () => {
    idInput.value = "";
    error.style.display = "none";
    // เคลียร์ error border ทั้งหมด
    document
      .querySelectorAll(".input-error")
      .forEach((el) => el.classList.remove("input-error"));

    if (r.value === "company") {
      maxLen = 13;
      idInput.placeholder = "ระบุเลขทะเบียนนิติบุคคล";
      personalInfoRow.classList.add("hidden");
      companyInfoRow.classList.remove("hidden");
      authorizedSection.classList.remove("hidden");
      if (authListContainer.children.length === 0) addAuthPerson();
    } else {
      personalInfoRow.classList.remove("hidden");
      companyInfoRow.classList.add("hidden");
      authorizedSection.classList.add("hidden");
      maxLen = r.value === "foreign" ? 10 : 13;
      idInput.placeholder =
        r.value === "foreign"
          ? "ระบุเลขที่หนังสือเดินทาง"
          : "ระบุเลขที่บัตรประชาชน";
    }
  });
});

// ------------------------------------------
// 2. ID Validation Logic
// ------------------------------------------
idInput.addEventListener("input", () => {
  idInput.value = idInput.value.replace(/\D/g, "");
  if (idInput.value.length > maxLen)
    idInput.value = idInput.value.slice(0, maxLen);
  error.style.display =
    idInput.value.length === maxLen || idInput.value.length === 0
      ? "none"
      : "block";
});

// ------------------------------------------
// 3. Dynamic Auth Person
// ------------------------------------------
function getAuthPersonTemplate(index) {
  return `
      <div class="auth-item" id="auth-item-${index}">
          <button type="button" class="btn-remove-auth" onclick="removeAuthPerson(${index})">
              <i class="fa-solid fa-trash-can"></i>
          </button>
          <div class="row">
              <div class="col">
              <label>ประเภท <span class="req">*</span></label>
              <select class="req-input auth-type">
                  <option value="">ระบุประเภท</option>
                  <option>บัตรประชาชน</option>
                  <option>หนังสือเดินทาง</option>
                  <option>ชาวต่างชาติ</option>
              </select>
              </div>
              <div class="col">
              <label>เลขที่บัตร <span class="req">*</span></label>
              <div class="input-icon">
                  <i class="fa-solid fa-id-card-clip"></i>
                  <input class="req-input auth-id" placeholder="ระบุเลขที่บัตร / Passport" />
              </div>
              </div>
          </div>
          <div class="row">
              <div class="col">
              <label>คำนำหน้า <span class="req">*</span></label>
              <select class="req-input">
                  <option value="">ระบุคำนำหน้า</option>
                  <option>นาย</option>
                  <option>นาง</option>
                  <option>นางสาว</option>
                  <option>เด็กชาย</option>
                  <option>เด็กหญิง</option>
              </select>
              </div>
              <div class="col">
              <label>ชื่อ <span class="req">*</span></label>
              <div class="input-icon">
                  <i class="fa-solid fa-user"></i>
                  <input class="req-input" placeholder="ระบุชื่อจริง" />
              </div>
              </div>
              <div class="col">
              <label>นามสกุล <span class="req">*</span></label>
              <div class="input-icon">
                  <i class="fa-solid fa-user"></i>
                  <input class="req-input" placeholder="ระบุนามสกุล" />
              </div>
              </div>
          </div>
      </div>
    `;
}

let authCounter = 0;
function addAuthPerson() {
  authCounter++;
  authListContainer.insertAdjacentHTML(
    "beforeend",
    getAuthPersonTemplate(authCounter)
  );
  updateRemoveButtons();

  const newItem = document.getElementById(`auth-item-${authCounter}`);
  const typeSelect = newItem.querySelector(".auth-type");
  const idInput = newItem.querySelector(".auth-id");

  typeSelect.addEventListener("change", () => {
    idInput.value = "";
    idInput.classList.remove("input-error");

    if (typeSelect.value === "บัตรประชาชน") {
      idInput.maxLength = 13;
      idInput.placeholder = "ระบุเลขบัตรประชาชน 13 หลัก";
    } else if (typeSelect.value === "ชาวต่างชาติ") {
      idInput.maxLength = 10;
      idInput.placeholder = "ระบุเลข 10 หลัก ";
    } else {
      idInput.removeAttribute("maxLength");
      idInput.placeholder = "ระบุเลขที่บัตร / Passport";
    }
  });

  idInput.addEventListener("input", () => {
    if (
      typeSelect.value === "บัตรประชาชน" ||
      typeSelect.value === "ชาวต่างชาติ"
    ) {
      idInput.value = idInput.value.replace(/\D/g, "");
    }
  });
}

window.removeAuthPerson = function (id) {
  const item = document.getElementById(`auth-item-${id}`);
  if (item) item.remove();
  updateRemoveButtons();
};

function updateRemoveButtons() {
  const removeBtns = authListContainer.querySelectorAll(".btn-remove-auth");
  removeBtns.forEach((btn) => (btn.style.display = "block"));
}

addAuthBtn.addEventListener("click", addAuthPerson);

// ------------------------------------------
// 4. MAIN VALIDATION FUNCTION (ตรวจสอบข้อมูล)
// ------------------------------------------
submitBtn.addEventListener("click", function (e) {
  e.preventDefault();
  let isValid = true;
  let firstErrorField = null;

  // Helper Function to check Empty
  function validateField(el) {
    if (!el.value.trim()) {
      el.classList.add("input-error");
      isValid = false;
      if (!firstErrorField) firstErrorField = el;
    } else {
      el.classList.remove("input-error");
    }
  }

  // ล้าง Error เดิมเมื่อเริ่มพิมพ์
  document.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => el.classList.remove("input-error"));
  });

  // 1. Check ID Card
  validateField(idInput);
  if (idInput.value.length > 0 && idInput.value.length !== maxLen) {
    isValid = false;
    idInput.classList.add("input-error");
  }

  // 2. Check Common Fields (Address, Email, Mobile)
  validateField(document.getElementById("address"));
  validateField(document.getElementById("email"));
  validateField(document.getElementById("mobile"));

  // 3. Check Condition Fields
  const currentType = document.querySelector(
    'input[name="type"]:checked'
  ).value;

  if (currentType === "company") {
    // ตรวจสอบชื่อบริษัท
    validateField(document.getElementById("cName"));

    // ตรวจสอบผู้มีอำนาจลงนาม (ทุกคนในลิสต์)
    const authInputs = authListContainer.querySelectorAll(".req-input");
    authInputs.forEach((input) => validateField(input));
  } else {
    // ตรวจสอบข้อมูลส่วนตัว (บุคคลธรรมดา/ต่างชาติ)
    validateField(document.getElementById("pTitle"));
    validateField(document.getElementById("pName"));
    validateField(document.getElementById("pSurname"));
  }

  // 4. Check Checkbox
  const terms = document.getElementById("termsCheckbox");
  if (!terms.checked) {
    alert("กรุณายอมรับเงื่อนไขการใช้บริการ");
    return;
  }

  // FINAL RESULT
  if (!isValid) {
    alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
    if (firstErrorField) firstErrorField.focus();
  } else {
    alert("ลงทะเบียนสำเร็จ! (Demo)");
    window.location.href = "login.html";
  }
});
