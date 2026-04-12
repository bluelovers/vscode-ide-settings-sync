## ADDED Requirements

### Requirement: Source IDE Selection via Radio
The system SHALL allow users to select a single IDE as the "source IDE" using a radio button, enabling explicit control over which IDE's settings are used as the synchronization source.

#### Scenario: User selects source IDE
- **WHEN** user clicks the radio button next to an IDE in the IDE list
- **THEN** that IDE is highlighted as the source IDE with a distinct visual style
- **AND** previously selected source IDE is deselected

#### Scenario: No source IDE selected initially
- **WHEN** the IDE list is first displayed with no source IDE pre-selected
- **THEN** the first available IDE is automatically selected as the source IDE
- **AND** it is visually highlighted

### Requirement: Source IDE Display Indicator
The system SHALL display the currently selected source IDE below the IDE list, providing clear feedback to users about which IDE will be used as the sync source.

#### Scenario: Source IDE is selected
- **WHEN** a source IDE has been selected
- **THEN** a display indicator shows the selected source IDE name below the IDE list
- **AND** the indicator updates when the source IDE changes

### Requirement: Source IDE Visual Highlighting
The system SHALL highlight the selected source IDE with a different background color to clearly distinguish it from other IDEs in the list.

#### Scenario: Source IDE is highlighted
- **WHEN** an IDE is selected as the source IDE
- **THEN** the IDE item displays with a distinct background color (e.g., light blue)
- **AND** non-source IDEs retain their default styling
