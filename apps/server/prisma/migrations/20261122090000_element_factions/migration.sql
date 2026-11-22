-- Đổi mã 12 hệ từ tên tộc cũ sang 12 nguyên tố (light, wind, wood, shadow, thunder, blood, crystal, stone, metal, water, fire, ice)
ALTER TABLE "Account" ALTER COLUMN "faction" SET DEFAULT 'light';

UPDATE "Account" SET "faction" = CASE "faction"
    WHEN 'tribe' THEN 'light'
    WHEN 'orc' THEN 'wind'
    WHEN 'elf' THEN 'wood'
    WHEN 'undead' THEN 'shadow'
    WHEN 'samurai' THEN 'thunder'
    WHEN 'viking' THEN 'blood'
    WHEN 'desert' THEN 'crystal'
    WHEN 'steam' THEN 'stone'
    WHEN 'dwarf' THEN 'metal'
    WHEN 'tide' THEN 'water'
    WHEN 'dragon' THEN 'fire'
    WHEN 'frost' THEN 'ice'
    ELSE "faction"
  END;

UPDATE "CampaignStar" SET "faction" = CASE "faction"
    WHEN 'tribe' THEN 'light'
    WHEN 'orc' THEN 'wind'
    WHEN 'elf' THEN 'wood'
    WHEN 'undead' THEN 'shadow'
    WHEN 'samurai' THEN 'thunder'
    WHEN 'viking' THEN 'blood'
    WHEN 'desert' THEN 'crystal'
    WHEN 'steam' THEN 'stone'
    WHEN 'dwarf' THEN 'metal'
    WHEN 'tide' THEN 'water'
    WHEN 'dragon' THEN 'fire'
    WHEN 'frost' THEN 'ice'
    ELSE "faction"
  END;

UPDATE "MatchRecord" SET "faction" = CASE "faction"
    WHEN 'tribe' THEN 'light'
    WHEN 'orc' THEN 'wind'
    WHEN 'elf' THEN 'wood'
    WHEN 'undead' THEN 'shadow'
    WHEN 'samurai' THEN 'thunder'
    WHEN 'viking' THEN 'blood'
    WHEN 'desert' THEN 'crystal'
    WHEN 'steam' THEN 'stone'
    WHEN 'dwarf' THEN 'metal'
    WHEN 'tide' THEN 'water'
    WHEN 'dragon' THEN 'fire'
    WHEN 'frost' THEN 'ice'
    ELSE "faction"
  END,
  "vsFaction" = CASE "vsFaction"
    WHEN 'tribe' THEN 'light'
    WHEN 'orc' THEN 'wind'
    WHEN 'elf' THEN 'wood'
    WHEN 'undead' THEN 'shadow'
    WHEN 'samurai' THEN 'thunder'
    WHEN 'viking' THEN 'blood'
    WHEN 'desert' THEN 'crystal'
    WHEN 'steam' THEN 'stone'
    WHEN 'dwarf' THEN 'metal'
    WHEN 'tide' THEN 'water'
    WHEN 'dragon' THEN 'fire'
    WHEN 'frost' THEN 'ice'
    ELSE "vsFaction"
  END;
