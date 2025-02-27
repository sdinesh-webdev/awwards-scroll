// Import awards data from external file
import { awards } from "./data.js";

// Initialize smooth scrolling when DOM is fully loaded
// document.addEventListener("DOMContentLoaded", () => {
//   // Create new Lenis instance for smooth scrolling with automatic RAF (RequestAnimationFrame)
//   const lenis = new Lenis({
//     autoRaf: true,
//   });
// });

// Cache DOM element references for better performance
const awardsListContainer = document.querySelector(".awards-list");
const awardPreview = document.querySelector(".award-preview");
const awardsList = document.querySelector(".awards-list");

// Define vertical position constants for award animations
const POSITIONS = {
  BOTTOM: 0, // Bottom position (0px offset)
  MIDDLE: -80, // Middle position (-80px offset)
  TOP: -160, // Top position (-160px offset)
};

// Initialize state variables
let lastMousePosition = { x: 0, y: 0 }; // Track mouse coordinates
let activeAward = null; // Currently active award element
let ticking = false; // RAF throttling flag
let mouseTimeout = null; // Timer for mouse movement
let isMouseMoving = false; // Mouse movement state

// Dynamic creation of award elements
awards.forEach((award) => {
  // Create container for each award
  const awardElement = document.createElement("div");
  awardElement.className = "award";

  // Populate award content with award details
  awardElement.innerHTML = `
        <div class="award-wrapper">
            <div class='award-name'>
                <h1>${award.name}</h1>
                <h1>${award.type}</h1>                
            </div>
            <div class='award-project'>
                <h1>${award.project}</h1>
                <h1>${award.label}</h1>
            </div>
            <div class='award-name'>
                <h1>${award.name}</h1>
                <h1>${award.type}</h1>

            </div>
        </div>
    `;

  // Add award element to container
  awardsListContainer.appendChild(awardElement);
});

// Get all award elements for event handling
const awardsElements = document.querySelectorAll(".award");

// Function to handle preview image animations
const animatePreview = () => {
  // Get awards list boundaries
  const awardsListReact = awardsList.getBoundingClientRect();

  // Check if mouse is outside awards list
  if (
    lastMousePosition.x < awardsListReact.left ||
    lastMousePosition.x > awardsListReact.right ||
    lastMousePosition.y < awardsListReact.top ||
    lastMousePosition.y > awardsListReact.bottom
  ) {
    // Animate out and remove preview images when mouse leaves
    const previewImages = awardPreview.querySelectorAll("img");
    previewImages.forEach((img) => {
      gsap.to(img, {
        scale: 0,
        duration: 0.4,
        ease: "power2.Out",
        onComplete: () => img.remove(),
      });
    });
  }
};

// Function to update awards positions based on mouse interaction
const updateAwards = () => {
  // Handle preview animations
  animatePreview();

  // Check if active award should remain active
  if (activeAward) {
    const rect = activeAward.getBoundingClientRect();
    const isStillOver =
      lastMousePosition.x > rect.left &&
      lastMousePosition.x < rect.right &&
      lastMousePosition.y > rect.top &&
      lastMousePosition.y < rect.bottom;

    if (!isStillOver) {
      const wrapper = activeAward.querySelector(".award-wrapper");
      const leavingFromTop = lastMousePosition.y < rect.top + rect.height / 2;

      gsap.to(wrapper, {
        y: leavingFromTop ? POSITIONS.TOP : POSITIONS.BOTTOM,
        duration: 0.4,
        ease: "power2.out",
      });
      activeAward = null;
    }
  }

  // Update positions of all awards
  awardsElements.forEach((award) => {
    if (award === activeAward) return;

    const rect = award.getBoundingClientRect();
    const isMouseOver =
      lastMousePosition.x > rect.left &&
      lastMousePosition.x < rect.right &&
      lastMousePosition.y > rect.top &&
      lastMousePosition.y < rect.bottom;

    if (isMouseOver) {
      const wrapper = award.querySelector(".award-wrapper");
      gsap.to(wrapper, {
        y: POSITIONS.MIDDLE,
        duration: 0.4,
        ease: "power2.out",
      });
      activeAward = award;
    }
  });
  ticking = false;
};

// Mouse movement event handler
document.addEventListener("mousemove", (e) => {
  // Update mouse position
  lastMousePosition.x = e.clientX;
  lastMousePosition.y = e.clientY;

  // Reset mouse movement state and timeout
  isMouseMoving = true;
  if (mouseTimeout) {
    clearTimeout(mouseTimeout);
  }

  // Check if mouse is within awards list
  const awardsListRect = awardsList.getBoundingClientRect();
  const isInsideAwardsList =
    lastMousePosition.x > awardsListRect.left &&
    lastMousePosition.x < awardsListRect.right &&
    lastMousePosition.y > awardsListRect.top &&
    lastMousePosition.y < awardsListRect.bottom;

  if (isInsideAwardsList) {
    mouseTimeout = setTimeout(() => {
      isMouseMoving = false;
      const images = awardPreview.querySelectorAll("img");
      if (images.length > 1) {
        const lastImage = images[images.length - 1];
        images.forEach((img) => {
          if (img !== lastImage) {
            gsap.to(img, {
              scale: 0,
              duration: 0.4,
              ease: "power2.out",
              onComplete: () => img.remove(),
            });
          }
        });
      }
    }, 2000);
  }

  animatePreview();
});

// Optimize scroll performance with RAF
document.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateAwards();
      });
      ticking = true;
    }
  },
  { passive: true }
);

// Utility function to attempt loading images in different formats
const tryLoadImage = async (index) => {
  const formats = ["jpg", "png"];
  // Try loading image in different formats until successful
  for (const format of formats) {
    try {
      const img = document.createElement("img");
      img.src = `assets/img${index + 1}.${format}`;

      // Return promise that resolves with the image if it loads successfully
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
      });

      return img;
    } catch (error) {
      continue; // Try next format if current one fails
    }
  }
  console.warn(`Failed to load image ${index + 1} in any format`);
  return null;
};

// Add interactive behavior to award elements
awardsElements.forEach((award, index) => {
  const wrapper = award.querySelector(".award-wrapper");
  let currentPosition = POSITIONS.TOP;

  // Handle mouse enter events
  award.addEventListener("mouseenter", async (e) => {
    activeAward = award;
    const rect = award.getBoundingClientRect();
    const enterFromTop = e.clientY < rect.top + rect.height / 2;

    if (enterFromTop || currentPosition === POSITIONS.BOTTOM) {
      currentPosition = POSITIONS.MIDDLE;
      gsap.to(wrapper, {
        y: POSITIONS.MIDDLE,
        duration: 0.4,
        ease: "power2.out",
      });
    }

    const img = await tryLoadImage(index);
    if (img) {
      img.style.position = "absolute";
      img.style.top = 0;
      img.style.left = 0;
      img.style.scale = 0;
      img.style.zIndex = Date.now();

      awardPreview.appendChild(img);

      gsap.to(img, {
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  });

  // Handle mouse leave events
  award.addEventListener("mouseleave", (e) => {
    activeAward = null;
    const rect = award.getBoundingClientRect();
    const leavingFromTop = e.clientY < rect.top + rect.height / 2;

    currentPosition = leavingFromTop ? POSITIONS.TOP : POSITIONS.BOTTOM;
    gsap.to(wrapper, {
      y: currentPosition,
      duration: 0.4,
      ease: "power2.out",
    });
  });
});
