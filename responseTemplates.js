// responseTemplates.js - Templates pour répondre aux annonces Reddit

export const generateResponse = (jobType, budget, description = "") => {
    const templates = {
        creatureDesign: [
            {
                condition: budget => budget >= 500,
                response: `Hi there! I'd love to work on your creature design project. I specialize in semi-realistic creature concepts and have experience bringing unique beasts to life. 

My approach focuses on both anatomical believability and creative storytelling - whether it's a dragon with unique evolutionary traits or a demon with cultural significance.

I typically work in digital medium with detailed concept sheets including multiple views and anatomical notes. Would you like to see some relevant samples from my portfolio?

Looking forward to discussing the project details with you!`
            },
            {
                condition: budget => budget >= 200,
                response: `Hello! Your creature design project caught my eye. I have a strong background in fantasy creature concepts and love developing original beings with their own personality and lore.

My process usually involves initial sketches to nail down the concept, followed by a refined illustration with attention to anatomy and believable design elements.

I'd be happy to discuss your vision and see if we're a good fit. Could you share any reference materials or specific requirements you have in mind?

Thanks for your time!`
            },
            {
                condition: budget => budget < 200,
                response: `Hi! I'm interested in your creature design project. I work in a semi-realistic style and enjoy creating unique fantasy beings.

I'd love to learn more about the scope and your specific vision. What kind of creature did you have in mind, and do you have any references or style preferences?

Looking forward to hearing from you!`
            }
        ],

        characterDesign: [
            {
                condition: budget => budget >= 300,
                response: `Hello! I'm very interested in your character design commission. I specialize in creating detailed character concepts with a focus on storytelling through design.

My style leans toward semi-realistic with stylized elements, which works particularly well for fantasy and RPG characters. I enjoy developing not just the visual design but also thinking about the character's background and personality to inform the aesthetic choices.

I typically provide concept sketches, refined illustrations, and can include reference sheets if needed. Would you like to see some examples of my character work?

Happy to discuss your project in more detail!`
            },
            {
                condition: budget => budget >= 150,
                response: `Hi there! Your character design project sounds interesting. I work in a semi-realistic style and love bringing unique characters to life through thoughtful design choices.

I'm curious about the character's background and the world they inhabit - these details always help me create more authentic and compelling designs.

Would you be able to share more details about what you're looking for? Any specific style references or character traits you want to emphasize?

Thanks!`
            }
        ],

        dndRpg: [
            {
                condition: budget => budget >= 400,
                response: `Hi! As someone who's passionate about D&D and tabletop RPGs, I'd love to work on this commission. I understand how important it is to capture not just the visual aspects but also the character's personality and story.

I work in a semi-realistic style that balances fantasy elements with believable anatomy and design. Whether it's a battle-scarred paladin or a mysterious warlock, I focus on making characters that feel like they have stories to tell.

I'd love to hear about your character's class, background, and any specific moments or traits you'd like highlighted in the artwork.

Looking forward to potentially bringing your character to life!`
            },
            {
                condition: budget => budget >= 200,
                response: `Hello! Your D&D commission caught my attention. I really enjoy working on RPG characters because there's always such rich backstory to work with.

I'd love to learn more about your character - their class, personality, and any specific details that make them unique. Do you have any reference images or particular scenes you'd like depicted?

My style works well for fantasy characters and I focus on creating designs that feel true to the character's story.

Thanks for considering me for your project!`
            }
        ],

        boardGame: [
            {
                condition: budget => budget >= 600,
                response: `Hello! I'm very interested in your board game art project. Game illustration is a particular passion of mine, and I love how it combines storytelling with functional design.

I work in a semi-realistic style that translates well to game components, whether it's character cards, creature designs, or thematic illustrations. I understand the importance of clarity and visual consistency in game art.

I'd love to learn more about your game's theme and the specific assets you need. Are you looking for character designs, creatures, items, or environmental pieces?

Looking forward to potentially being part of your project!`
            },
            {
                condition: budget => budget >= 300,
                response: `Hi there! Your game art project sounds exciting. I have experience with board game illustration and understand the unique requirements of game components.

I'd be interested to learn more about your game's theme and the style you're aiming for. What type of artwork are you looking for - characters, creatures, items, or something else?

My portfolio includes fantasy and creature work that might be relevant. Would you like to see some examples?

Thanks!`
            }
        ],

        generic: [
            {
                condition: () => true,
                response: `Hello! I'm interested in your art commission. I specialize in character and creature design with a semi-realistic, stylized approach.

Could you tell me more about what you're looking for? I'd love to learn about your vision and see if my style would be a good fit for your project.

Thanks for your time!`
            }
        ]
    };

    // Extraire le budget du texte
    const budgetMatch = (description + " ").match(/\$(\d+)/);
    const budgetAmount = budgetMatch ? parseInt(budgetMatch[1]) : 0;

    // Sélectionner le template approprié
    let selectedTemplates = templates.generic;

    if (jobType.includes("creature") || jobType.includes("monster") || jobType.includes("beast")) {
        selectedTemplates = templates.creatureDesign;
    } else if (jobType.includes("character") || jobType.includes("oc")) {
        selectedTemplates = templates.characterDesign;
    } else if (jobType.includes("dnd") || jobType.includes("d&d") || jobType.includes("rpg")) {
        selectedTemplates = templates.dndRpg;
    } else if (
        jobType.includes("board game") ||
        jobType.includes("card game") ||
        jobType.includes("game")
    ) {
        selectedTemplates = templates.boardGame;
    }

    // Trouver le template qui correspond au budget
    const appropriateTemplate =
        selectedTemplates.find(template => template.condition(budgetAmount)) ||
        selectedTemplates[selectedTemplates.length - 1];

    return {
        response: appropriateTemplate.response,
        detectedBudget: budgetAmount,
        selectedCategory:
            selectedTemplates === templates.creatureDesign
                ? "creature"
                : selectedTemplates === templates.characterDesign
                  ? "character"
                  : selectedTemplates === templates.dndRpg
                    ? "dnd"
                    : selectedTemplates === templates.boardGame
                      ? "game"
                      : "generic"
    };
};
